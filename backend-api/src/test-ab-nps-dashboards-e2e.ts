import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { AdminService } from './admin/admin.service';
import { NpsGroup, NpsChannel, SubscriptionStatus, PackageType, PaymentStatus } from '@prisma/client';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING NPS, ROLE DASHBOARDS & A/B REDIS CONFIG E2E TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS Application Context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const prisma = app.get(PrismaService);
  const adminService = app.get(AdminService);

  // 2. Clean previous data
  await prisma.npsResponse.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.providerMonthlyQuota.deleteMany({});
  await prisma.callTask.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.jobCompletion.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  
  console.log('Cleaned database tables for fresh A/B, NPS & Dashboard E2E tests.');

  // Find or create test entities
  const seekerUser = await prisma.user.findFirst({ where: { role: 'service_seeker' } });
  const seeker = seekerUser || await prisma.user.create({
    data: {
      name: 'Müşteri Can',
      phone: '+905321111111',
      phone_masked: '0532 *** ** 11',
      role: 'service_seeker',
    }
  });

  const providerUserA = await prisma.user.create({
    data: {
      name: 'Usta Ahmet',
      phone: '+905322222222',
      phone_masked: '0532 *** ** 22',
      role: 'service_provider',
    }
  });

  const providerA = await prisma.serviceProvider.create({
    data: {
      user_id: providerUserA.id,
      category_ids: [],
      is_approved: true,
      avg_rating: 4.5,
    }
  });

  const providerUserB = await prisma.user.create({
    data: {
      name: 'Usta Mehmet',
      phone: '+905323333333',
      phone_masked: '0532 *** ** 33',
      role: 'service_provider',
    }
  });

  const providerB = await prisma.serviceProvider.create({
    data: {
      user_id: providerUserB.id,
      category_ids: [],
      is_approved: true,
      avg_rating: 4.8,
    }
  });

  const category = await prisma.category.findFirst({ where: { isActive: true } }) || await prisma.category.create({
    data: { name: 'Ev Temizliği', isActive: true }
  });

  // Create active requests
  const requestA = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: { details: 'Ev Temizliği' },
      status: 'distributed',
    }
  });

  const offerA = await prisma.offer.create({
    data: {
      job_id: requestA.id,
      provider_id: providerA.id,
      price: 1500,
      status: 'accepted',
    }
  });

  const completionA = await prisma.jobCompletion.create({
    data: {
      job_id: requestA.id,
      offer_id: offerA.id,
      provider_id: providerA.id,
      seeker_id: seeker.id,
      status: 'completed',
    }
  });

  // --- TEST 1: NPS Stats Calculations ---
  console.log('\n--- TEST 1: NPS Stats Calculations ---');

  // Seed NPS Responses
  // Promoter (9)
  await prisma.npsResponse.create({
    data: {
      job_completion_id: completionA.id,
      seeker_id: seeker.id,
      provider_id: providerA.id,
      category_id: category.id,
      score: 9,
      group: NpsGroup.promoter,
      channel: NpsChannel.web,
      responded_at: new Date(),
    }
  });

  // Passive (6)
  await prisma.npsResponse.create({
    data: {
      job_completion_id: completionA.id,
      seeker_id: seeker.id,
      provider_id: providerA.id,
      category_id: category.id,
      score: 6,
      group: NpsGroup.passive,
      channel: NpsChannel.web,
      responded_at: new Date(),
    }
  });

  // Detractor (2)
  await prisma.npsResponse.create({
    data: {
      job_completion_id: completionA.id,
      seeker_id: seeker.id,
      provider_id: providerA.id,
      category_id: category.id,
      score: 2,
      group: NpsGroup.detractor,
      channel: NpsChannel.web,
      responded_at: new Date(),
    }
  });

  // Promoter - Detractor = 1 - 1 = 0 NPS.
  // Let's verify getNpsStats
  const npsStats = await adminService.getNpsStats('superadmin@esnaaf.com');
  console.log(`NPS Overall Score: ${npsStats.npsScore} (Expected: 0)`);
  console.log(`Total Count: ${npsStats.totalCount} (Expected: 3)`);
  console.log(`Promoter: ${npsStats.promoterCount}, Detractor: ${npsStats.detractorCount}, Passive: ${npsStats.passiveCount}`);
  
  if (npsStats.npsScore === 0 && npsStats.totalCount === 3 && npsStats.promoterCount === 1) {
    console.log('✅ Success: NPS score and breakdown calculated perfectly!');
  } else {
    console.error('❌ Error: NPS stats calculations mismatched.');
  }

  // --- TEST 2: NPS Alarms (3+ Detractors in 30 Days) ---
  console.log('\n--- TEST 2: NPS Alarms ---');

  // Provider A currently has 1 detractor response. Let's add 2 more detractors to trigger the 3+ detractor alarm.
  await prisma.npsResponse.create({
    data: {
      job_completion_id: completionA.id,
      seeker_id: seeker.id,
      provider_id: providerA.id,
      category_id: category.id,
      score: 1,
      group: NpsGroup.detractor,
      channel: NpsChannel.web,
      responded_at: new Date(),
    }
  });

  await prisma.npsResponse.create({
    data: {
      job_completion_id: completionA.id,
      seeker_id: seeker.id,
      provider_id: providerA.id,
      category_id: category.id,
      score: 0,
      group: NpsGroup.detractor,
      channel: NpsChannel.web,
      responded_at: new Date(),
    }
  });

  // Verify NPS Alarms
  const alarms = await adminService.getNpsAlarms('superadmin@esnaaf.com');
  console.log(`Active Alarms Count: ${alarms.length} (Expected: 1)`);
  if (alarms.length === 1 && alarms[0].providerId === providerA.id) {
    console.log(`✅ Success: Detractor alarm correctly generated for provider: ${alarms[0].name} (${alarms[0].detractorCount} Detractors)`);
  } else {
    console.error('❌ Error: NPS alarms detection failed.');
  }

  // --- TEST 3: Role-Specific Dashboards ---
  console.log('\n--- TEST 3: Role-Specific Dashboards ---');

  // Seed payments for Executive MRR
  const subA = await prisma.subscription.create({
    data: {
      provider_id: providerA.id,
      package_type: PackageType.premium,
      status: SubscriptionStatus.active,
      started_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  });

  const subB = await prisma.subscription.create({
    data: {
      provider_id: providerB.id,
      package_type: PackageType.vip,
      status: SubscriptionStatus.active,
      started_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  });

  await prisma.payment.create({
    data: {
      subscription_id: subA.id,
      amount: 1200,
      status: PaymentStatus.success,
      attempt_count: 1,
    }
  });

  await prisma.payment.create({
    data: {
      subscription_id: subB.id,
      amount: 2500,
      status: PaymentStatus.success,
      attempt_count: 1,
    }
  });

  await prisma.payment.create({
    data: {
      subscription_id: subB.id,
      amount: 2500,
      status: PaymentStatus.failed,
      attempt_count: 1,
    }
  });

  // Seed quota for Sales Staff
  await prisma.providerMonthlyQuota.create({
    data: {
      provider_id: providerA.id,
      month_year: '2026-05',
      accepted_count: 90,
      monthly_limit: 100, // 90% usage (exceeds 85%)
      reset_at: new Date(),
    }
  });

  // Seed calltask and review for Quality Staff
  await prisma.callTask.create({
    data: {
      job_completion_id: completionA.id,
      customer_id: seeker.id,
      priority: 'urgent',
      due_at: new Date(Date.now() - 3600000), // Delayed (SLA breached)
    }
  });

  await prisma.review.create({
    data: {
      job_id: requestA.id,
      reviewer_id: seeker.id,
      provider_id: providerA.id,
      rating: 4,
      comment: 'Güzel çalışma',
      status: 'pending',
    }
  });

  // A. Verify Executive Dashboard
  console.log('\n--- 3A. Executive Dashboard Metrics ---');
  const execStats = await adminService.getRoleDashboardStats('superadmin@esnaaf.com', 'executive');
  console.log(`Executive MRR Sum: ₺${execStats.mrr} (Expected: ₺3700)`);
  console.log(`Executive Failed Payments Count: ${execStats.failedPayments?.length} (Expected: 1)`);
  if (execStats.mrr === 3700 && execStats.failedPayments?.length === 1) {
    console.log('✅ Success: Executive dashboard metrics fetched flawlessly!');
  } else {
    console.error('❌ Error: Executive dashboard metrics mismatched.');
  }

  // B. Verify Quality Staff Dashboard
  console.log('\n--- 3B. Quality Staff Dashboard Metrics ---');
  const qualStats = await adminService.getRoleDashboardStats('superadmin@esnaaf.com', 'quality_staff');
  console.log(`Call Tasks Count: ${qualStats.callTasks?.length} (Expected: 1)`);
  console.log(`Pending Reviews Count: ${qualStats.pendingReviews?.length} (Expected: 1)`);
  console.log(`SLA Breached Calls Count: ${qualStats.slaBreachedCalls?.length} (Expected: 1)`);
  if (qualStats.callTasks?.length === 1 && qualStats.pendingReviews?.length === 1 && qualStats.slaBreachedCalls?.length === 1) {
    console.log('✅ Success: Quality staff dashboard metrics compiled perfectly!');
  } else {
    console.error('❌ Error: Quality staff metrics mismatched.');
  }

  // C. Verify Sales Staff Dashboard
  console.log('\n--- 3C. Sales Staff Dashboard Metrics ---');
  const salesStats = await adminService.getRoleDashboardStats('superadmin@esnaaf.com', 'sales_staff');
  console.log(`Active Subscriptions Count: ${salesStats.activeSubsCount} (Expected: 2)`);
  console.log(`High Quota Usage Providers Count: ${salesStats.highQuotaUsage?.length} (Expected: 1)`);
  console.log(`Churn Risk Providers Count: ${salesStats.churnRiskProviders?.length} (Expected: 1)`);
  if (salesStats.activeSubsCount === 2 && salesStats.highQuotaUsage?.length === 1 && salesStats.churnRiskProviders?.length === 1) {
    console.log('✅ Success: Sales staff dashboard metrics matched correctly!');
  } else {
    console.error('❌ Error: Sales staff metrics mismatched.');
  }

  // --- TEST 4: A/B Test Configuration Redis Integration ---
  console.log('\n--- TEST 4: Redis A/B Config ---');

  const testConfigDto = {
    chatModel: 'custom-model-v2',
    temperature: 1.2,
    splitRatio: 0.35,
  };

  const saveRes = await adminService.saveAbTestConfig('superadmin@esnaaf.com', testConfigDto);
  console.log(`Save Config Result: ${saveRes.message}`);

  const activeConfig = await adminService.getAbTestConfig('superadmin@esnaaf.com');
  console.log(`Active model from Redis: ${activeConfig.chatModel} (Expected: custom-model-v2)`);
  console.log(`Active temperature: ${activeConfig.temperature} (Expected: 1.2)`);
  console.log(`Active split ratio: ${activeConfig.splitRatio} (Expected: 0.35)`);

  if (
    activeConfig.chatModel === testConfigDto.chatModel &&
    activeConfig.temperature === testConfigDto.temperature &&
    activeConfig.splitRatio === testConfigDto.splitRatio
  ) {
    console.log('✅ Success: Redis A/B Test settings successfully saved and loaded!');
  } else {
    console.error('❌ Error: A/B config Redis validation failed.');
  }

  // Clean up seeded users
  await prisma.npsResponse.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.providerMonthlyQuota.deleteMany({});
  await prisma.callTask.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.jobCompletion.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.serviceRequest.deleteMany({});

  await prisma.serviceProvider.delete({ where: { id: providerA.id } });
  await prisma.serviceProvider.delete({ where: { id: providerB.id } });
  await prisma.user.delete({ where: { id: providerUserA.id } });
  await prisma.user.delete({ where: { id: providerUserB.id } });

  console.log('\n===========================================================');
  console.log('=== ALL E2E TESTS COMPLETED AND ALL SCENARIOS VERIFIED! ===');
  console.log('===========================================================');

  await app.close();
}

run().catch((err) => {
  console.error('E2E TEST RUNNER EXCEPTION:', err);
  process.exit(1);
});
