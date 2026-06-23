import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { TaleplerService } from './musteri/talepler/talepler.service';
import { JobCompletionService } from './ortak/job-completion/job-completion.service';
import { encryptPhone, maskPhone } from './common/utils/phone.util';
import { randomUUID } from 'crypto';
import { PackageType, SubscriptionStatus, JobCompletionStatus } from '@prisma/client';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING TEKLİ "AÇIK KAPI" COMMISSION MODEL E2E TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const prisma = app.get(PrismaService);
  const taleplerService = app.get(TaleplerService);
  const jobCompletionService = app.get(JobCompletionService);

  // 2. Clean up previous test data
  await prisma.$executeRawUnsafe('TRUNCATE TABLE favorite_providers, referrals, campaigns, campaign_usage, provider_monthly_quota, subscriptions, payments, job_completions, call_tasks, phone_reveal_logs, accepted_offers, offers, service_requests, service_providers, users CASCADE');
  console.log('Database tables truncated for fresh testing.');

  // Create Category
  const category = await prisma.category.upsert({
    where: { name: 'Elektrik Tesisatı' },
    create: { name: 'Elektrik Tesisatı', isActive: true },
    update: { isActive: true },
  });

  const seekerId = randomUUID();
  const providerUserId = randomUUID();
  const providerId = randomUUID();

  // Seed Seeker
  const haPhone = '+905330000020';
  const seeker = await prisma.user.create({
    data: {
      id: seekerId,
      phone: encryptPhone(haPhone),
      phone_masked: maskPhone(haPhone),
      name: 'Veli Müşteri',
      role: 'service_seeker',
      kvkk_consent: true,
    },
  });

  // Seed Provider User
  const hvPhone = '+905320000021';
  const providerUser = await prisma.user.create({
    data: {
      id: providerUserId,
      phone: encryptPhone(hvPhone),
      phone_masked: maskPhone(hvPhone),
      name: 'Yakup Usta',
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
      open_door_right: false, // Start with false
    },
  });

  // Seed Standard Subscription for the Provider (Standard package -> 7% commission rate)
  const subscription = await prisma.subscription.create({
    data: {
      id: randomUUID(),
      provider_id: provider.id,
      package_type: PackageType.standard,
      status: SubscriptionStatus.active,
      started_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('Seeded test Seeker, Provider, and Standard Subscription (7% commission package).');

  // =========================================================================
  // --- TEST 1: Direct Job Completion opens the door (open_door_right = true) ---
  // =========================================================================
  console.log('\n--- TEST 1: Direct Job Completion ---');

  // Create Direct Service Request
  const directRequest = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: {
        details: 'Direct test job details',
        name: seeker.name,
        city: 'Adana',
        district: 'Çukurova',
      },
      status: 'distributed',
      is_direct: true,
      direct_provider_id: provider.id,
      created_by_provider: true,
      direct_price: 1500,
    },
  });

  // Create Offer for the direct request
  const directOffer = await prisma.offer.create({
    data: {
      job_id: directRequest.id,
      provider_id: provider.id,
      price: 1500,
      status: 'pending',
    },
  });

  // Seeker accepts the direct offer
  await taleplerService.acceptOffer(seeker.id, directOffer.id, true);
  console.log('Direct job offer accepted.');

  // Verify that the offer's commission rate is stamped as 0 (direct jobs are always 0%)
  const acceptedDirectOffer = await prisma.offer.findUnique({ where: { id: directOffer.id } });
  console.log(`Direct offer commission rate (expected: 0): ${Number(acceptedDirectOffer?.commission_rate)}%`);
  if (Number(acceptedDirectOffer?.commission_rate) !== 0) {
    throw new Error('Test 1 Failed: Direct job offer commission rate is not 0%!');
  }

  // Mark job as started
  await prisma.offer.update({
    where: { id: directOffer.id },
    data: { started_at: new Date() },
  });

  // Provider declares completion
  await jobCompletionService.declareCompletion(providerUserId, directRequest.id, {
    price: 1500,
    note: 'Direct job finished.',
  });

  // Seeker confirms completion
  await jobCompletionService.confirmCompletion(seeker.id, directRequest.id, {
    confirmed: true,
  });
  console.log('Direct job completed successfully.');

  // Verify Provider open_door_right is now TRUE
  const updatedProvider1 = await prisma.serviceProvider.findUnique({ where: { id: provider.id } });
  console.log(`Provider open_door_right status (expected: true): ${updatedProvider1?.open_door_right}`);
  if (updatedProvider1?.open_door_right !== true) {
    throw new Error('Test 1 Failed: Provider open_door_right did not set to true after direct job completion!');
  }
  console.log('✅ TEST 1 PASSED: Direct job completion successfully opened the door!');

  // =========================================================================
  // --- TEST 2: Pool Job acceptance stamps 0% and closes the door (open_door_right = false) ---
  // =========================================================================
  console.log('\n--- TEST 2: Pool Job Acceptance with Open Door Right ---');

  // Create public pool Service Request
  const poolRequest1 = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: {
        details: 'Pool test job 1 details',
        name: seeker.name,
        city: 'Adana',
        district: 'Çukurova',
      },
      status: 'distributed',
      is_direct: false,
    },
  });

  // Create Offer for the pool request
  const poolOffer1 = await prisma.offer.create({
    data: {
      job_id: poolRequest1.id,
      provider_id: provider.id,
      price: 2000,
      status: 'pending',
    },
  });

  // Seeker accepts the pool offer
  await taleplerService.acceptOffer(seeker.id, poolOffer1.id, true);
  console.log('Pool job 1 offer accepted.');

  // Verify that the offer's commission rate is stamped as 0 (due to open door right)
  const acceptedPoolOffer1 = await prisma.offer.findUnique({ where: { id: poolOffer1.id } });
  console.log(`Pool job 1 commission rate (expected: 0): ${Number(acceptedPoolOffer1?.commission_rate)}%`);
  if (Number(acceptedPoolOffer1?.commission_rate) !== 0) {
    throw new Error('Test 2 Failed: Pool job 1 commission rate is not 0% despite open door right!');
  }

  // Verify Provider open_door_right is now FALSE (door is closed)
  const updatedProvider2 = await prisma.serviceProvider.findUnique({ where: { id: provider.id } });
  console.log(`Provider open_door_right status (expected: false): ${updatedProvider2?.open_door_right}`);
  if (updatedProvider2?.open_door_right !== false) {
    throw new Error('Test 2 Failed: Provider open_door_right was not reset to false after pool job acceptance!');
  }
  console.log('✅ TEST 2 PASSED: Pool job acceptance successfully used the open door right and closed it!');

  // =========================================================================
  // --- TEST 3: Next Pool Job acceptance stamps standard package rate (7%) ---
  // =========================================================================
  console.log('\n--- TEST 3: Pool Job Acceptance with Standard Rate ---');

  // Create another public pool Service Request
  const poolRequest2 = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: {
        details: 'Pool test job 2 details',
        name: seeker.name,
        city: 'Adana',
        district: 'Çukurova',
      },
      status: 'distributed',
      is_direct: false,
    },
  });

  // Create Offer for the second pool request
  const poolOffer2 = await prisma.offer.create({
    data: {
      job_id: poolRequest2.id,
      provider_id: provider.id,
      price: 2500,
      status: 'pending',
    },
  });

  // Seeker accepts the second pool offer
  await taleplerService.acceptOffer(seeker.id, poolOffer2.id, true);
  console.log('Pool job 2 offer accepted.');

  // Verify that the offer's commission rate is stamped as 7 (standard subscription plan commission rate)
  const acceptedPoolOffer2 = await prisma.offer.findUnique({ where: { id: poolOffer2.id } });
  console.log(`Pool job 2 commission rate (expected: 7): ${Number(acceptedPoolOffer2?.commission_rate)}%`);
  if (Number(acceptedPoolOffer2?.commission_rate) !== 7) {
    throw new Error('Test 3 Failed: Pool job 2 commission rate is not standard 7%!');
  }

  // Verify Provider open_door_right remains FALSE
  const updatedProvider3 = await prisma.serviceProvider.findUnique({ where: { id: provider.id } });
  console.log(`Provider open_door_right status (expected: false): ${updatedProvider3?.open_door_right}`);
  if (updatedProvider3?.open_door_right !== false) {
    throw new Error('Test 3 Failed: Provider open_door_right unexpectedly changed!');
  }
  console.log('✅ TEST 3 PASSED: Second pool job correctly stamped standard 7% subscription commission!');

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL OPEN DOOR COMMISSION MODEL TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
}

run().catch((err) => {
  console.error('E2E Test failed with error:', err);
  process.exit(1);
});
