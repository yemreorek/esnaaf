import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { TaleplerService } from './musteri/talepler/talepler.service';
import { JobCompletionService } from './ortak/job-completion/job-completion.service';
import { AbonelikService } from './hizmetveren/abonelik/abonelik.service';
import { encryptPhone, maskPhone } from './common/utils/phone.util';
import { randomUUID } from 'crypto';
import { PackageType, SubscriptionStatus } from '@prisma/client';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING MONTHLY COMMISSION BILLING E2E TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const prisma = app.get(PrismaService);
  const taleplerService = app.get(TaleplerService);
  const jobCompletionService = app.get(JobCompletionService);
  const abonelikService = app.get(AbonelikService);

  // 2. Clean up previous test data
  await prisma.$executeRawUnsafe('TRUNCATE TABLE favorite_providers, referrals, campaigns, campaign_usage, provider_monthly_quota, subscriptions, payments, job_completions, call_tasks, phone_reveal_logs, accepted_offers, offers, service_requests, service_providers, users CASCADE');
  console.log('Database tables truncated.');

  // Create Category
  const category = await prisma.category.upsert({
    where: { name: 'Boyacı' },
    create: { name: 'Boyacı', isActive: true },
    update: { isActive: true },
  });

  const seekerId = randomUUID();
  const providerUserId = randomUUID();
  const providerId = randomUUID();

  // Seed Seeker
  const haPhone = '+905330000030';
  const seeker = await prisma.user.create({
    data: {
      id: seekerId,
      phone: encryptPhone(haPhone),
      phone_masked: maskPhone(haPhone),
      name: 'Mert Seeker',
      role: 'service_seeker',
      kvkk_consent: true,
    },
  });

  // Seed Provider User
  const hvPhone = '+905320000031';
  const providerUser = await prisma.user.create({
    data: {
      id: providerUserId,
      phone: encryptPhone(hvPhone),
      phone_masked: maskPhone(hvPhone),
      name: 'Nuri Usta',
      role: 'service_provider',
      kvkk_consent: true,
    },
  });

  // Seed Provider profile
  const provider = await prisma.serviceProvider.create({
    data: {
      id: providerId,
      user_id: providerUser.id,
      category_ids: [category.id],
      is_approved: true,
      approved_at: new Date(),
      city: 'Adana',
      service_districts: ['Çukurova'],
      open_door_right: false,
    },
  });

  // Seed Standard Subscription (Standard package -> 7% commission rate)
  await prisma.subscription.create({
    data: {
      id: randomUUID(),
      provider_id: provider.id,
      package_type: PackageType.standard,
      status: SubscriptionStatus.active,
      started_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Seeded Seeker, Provider, and Standard Subscription (7% commission).');

  // =========================================================================
  // Step 1: Complete Direct Job (Commission: 0%, open_door_right -> true)
  // =========================================================================
  console.log('\n--- 1. Completing Direct Job ---');
  const directRequest = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: { details: 'Direct paint job', name: seeker.name, city: 'Adana', district: 'Çukurova' },
      status: 'distributed',
      is_direct: true,
      direct_provider_id: provider.id,
      created_by_provider: true,
      direct_price: 1000,
    },
  });

  const directOffer = await prisma.offer.create({
    data: { job_id: directRequest.id, provider_id: provider.id, price: 1000, status: 'pending' },
  });

  await taleplerService.acceptOffer(seeker.id, directOffer.id, true);
  await prisma.offer.update({ where: { id: directOffer.id }, data: { started_at: new Date() } });
  await jobCompletionService.declareCompletion(providerUser.id, directRequest.id, { price: 1000 });
  await jobCompletionService.confirmCompletion(seeker.id, directRequest.id, { confirmed: true });
  console.log('Direct job completed.');

  // =========================================================================
  // Step 2: Complete Pool Job 1 (Commission: 0% due to open door, open_door_right -> false)
  // =========================================================================
  console.log('\n--- 2. Completing Pool Job 1 (0% Commission) ---');
  const poolRequest1 = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: { details: 'Pool paint job 1', name: seeker.name, city: 'Adana', district: 'Çukurova' },
      status: 'distributed',
      is_direct: false,
    },
  });

  const poolOffer1 = await prisma.offer.create({
    data: { job_id: poolRequest1.id, provider_id: provider.id, price: 2000, status: 'pending' },
  });

  await taleplerService.acceptOffer(seeker.id, poolOffer1.id, true);
  await prisma.offer.update({ where: { id: poolOffer1.id }, data: { started_at: new Date() } });
  await jobCompletionService.declareCompletion(providerUser.id, poolRequest1.id, { price: 2000 });
  await jobCompletionService.confirmCompletion(seeker.id, poolRequest1.id, { confirmed: true });
  console.log('Pool job 1 completed.');

  // =========================================================================
  // Step 3: Complete Pool Job 2 (Commission: 7%, commission_paid: false)
  // =========================================================================
  console.log('\n--- 3. Completing Pool Job 2 (7% Commission) ---');
  const poolRequest2 = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: { details: 'Pool paint job 2', name: seeker.name, city: 'Adana', district: 'Çukurova' },
      status: 'distributed',
      is_direct: false,
    },
  });

  const poolOffer2 = await prisma.offer.create({
    data: { job_id: poolRequest2.id, provider_id: provider.id, price: 3000, status: 'pending' },
  });

  await taleplerService.acceptOffer(seeker.id, poolOffer2.id, true);
  await prisma.offer.update({ where: { id: poolOffer2.id }, data: { started_at: new Date() } });
  await jobCompletionService.declareCompletion(providerUser.id, poolRequest2.id, { price: 3000 });
  await jobCompletionService.confirmCompletion(seeker.id, poolRequest2.id, { confirmed: true });
  console.log('Pool job 2 completed.');

  // =========================================================================
  // Step 4: Verify Subscription Details contains correct unpaid commission
  // =========================================================================
  console.log('\n--- 4. Verifying Subscription Details and Commission Balances ---');
  const details = await abonelikService.getSubscriptionDetails(providerUser.id);
  console.log('Returned details:', JSON.stringify(details, null, 2));

  // Expected commission from job 2: 3000 * 0.07 = 210 TL
  console.log(`Unpaid Commission (expected: 210): ₺${details.unpaidCommission}`);
  if (details.unpaidCommission !== 210) {
    throw new Error(`Test Failed: Unpaid commission calculated incorrectly! Expected: 210, got: ${details.unpaidCommission}`);
  }

  const nextBillingDate = new Date(details.nextBillingDate);
  console.log(`Next Billing Date (expected 1st of next month): ${nextBillingDate.toLocaleDateString('tr-TR')}`);
  
  const expectedNextBillingDate = new Date();
  expectedNextBillingDate.setMonth(expectedNextBillingDate.getMonth() + 1);
  expectedNextBillingDate.setDate(1);
  expectedNextBillingDate.setHours(0, 0, 0, 0);

  if (nextBillingDate.getMonth() !== expectedNextBillingDate.getMonth() || nextBillingDate.getFullYear() !== expectedNextBillingDate.getFullYear()) {
    throw new Error(`Test Failed: Next billing date calculated incorrectly! Got: ${details.nextBillingDate}`);
  }

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL MONTHLY COMMISSION BILLING TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
}

run().catch((err) => {
  console.error('Monthly Billing Test failed:', err);
  process.exit(1);
});
