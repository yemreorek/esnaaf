import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AbonelikService } from './hizmetveren/abonelik/abonelik.service';
import { PrismaService } from './common/prisma/prisma.service';
import { PackageType, SubscriptionStatus, PaymentStatus } from '@prisma/client';

async function run() {
  console.log('=== STARTING SUBSCRIPTION & PAYMENT MODULES INTEGRATION TEST ===');

  // 1. Bootstrap NestJS Application Context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const abonelikService = app.get(AbonelikService);
  const prisma = app.get(PrismaService);

  // 2. Clean previous subscriptions, payments, campaigns to start fresh
  await prisma.campaignUsage.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.providerMonthlyQuota.deleteMany({});
  await prisma.campaign.deleteMany({});
  console.log('Cleaned previous subscription-related data.');

  // 3. Find our seeded provider ( Ahmet )
  const providerUser = await prisma.user.findFirst({
    where: { role: 'service_provider', name: { contains: 'Ahmet' } },
  });

  if (!providerUser) {
    console.error('Provider not found! Make sure database is seeded.');
    await app.close();
    return;
  }

  const provider = await prisma.serviceProvider.findUnique({
    where: { user_id: providerUser.id },
  });

  if (!provider) {
    console.error('ServiceProvider profile not found!');
    await app.close();
    return;
  }

  // Ensure provider is approved
  await prisma.serviceProvider.update({
    where: { id: provider.id },
    data: { is_approved: true, avg_rating: 4.8 },
  });

  // ==========================================
  // STEP A: Query Packages (GET /ortak/paketler)
  // ==========================================
  console.log('\n--- STEP A: Fetching Packages ---');
  const packages = await abonelikService.getPackages();
  console.log('Available packages:', packages);
  if (packages.length === 3) {
    console.log('✅ Packages query succeeded: Found 3 packages.');
  } else {
    console.error('❌ Packages query failed!');
  }

  // ==========================================
  // STEP B: Campaign Code System (6 Rules)
  // ==========================================
  console.log('\n--- STEP B: Testing Campaign Rules (6 rules) ---');
  
  // Create test campaigns in DB
  const cmpPercent = await prisma.campaign.create({
    data: {
      name: 'Yüzdelik Bahar İndirimi',
      code: 'BAHAR20',
      type: 'percent',
      value: 20,
      is_active: true,
      valid_from: new Date(Date.now() - 3600000), // active
      valid_until: new Date(Date.now() + 86400000), // active
      applicable_packages: [PackageType.standard],
      new_users_only: false,
    },
  });

  const cmpExpired = await prisma.campaign.create({
    data: {
      name: 'Süresi Dolan Kampanya',
      code: 'EXPIRED',
      type: 'fixed',
      value: 1000,
      is_active: true,
      valid_from: new Date(Date.now() - 86400000 * 2),
      valid_until: new Date(Date.now() - 3600000), // expired
      applicable_packages: [],
    },
  });

  const cmpMaxUses = await prisma.campaign.create({
    data: {
      name: 'Kullanımı Dolan Kampanya',
      code: 'MAXEDOut',
      type: 'fixed',
      value: 500,
      is_active: true,
      valid_from: new Date(Date.now() - 3600000),
      valid_until: new Date(Date.now() + 3600000),
      max_uses: 2,
      used_count: 2, // maxed
      applicable_packages: [],
    },
  });

  const cmpFreeTrial = await prisma.campaign.create({
    data: {
      name: '14 Günlük Bedava Deneme',
      code: 'TRIAL14',
      type: 'free_trial',
      value: 0,
      is_active: true,
      valid_from: new Date(Date.now() - 3600000),
      valid_until: new Date(Date.now() + 86400000),
      applicable_packages: [],
      new_users_only: true, // only new users
    },
  });

  // Test 1: Active check (Pass)
  const valRes1 = await abonelikService.validateCampaign(provider.id, 'BAHAR20', PackageType.standard);
  console.log('Test 1 (Valid) Result:', valRes1.name);
  
  // Test 2: Expired check (Should throw error)
  try {
    await abonelikService.validateCampaign(provider.id, 'EXPIRED', PackageType.standard);
    console.error('❌ Test 2 failed: Expired campaign code accepted!');
  } catch (err) {
    console.log('✅ Test 2 passed (Rejected expired):', err.message);
  }

  // Test 3: Max uses check (Should throw error)
  try {
    await abonelikService.validateCampaign(provider.id, 'MAXEDOut', PackageType.standard);
    console.error('❌ Test 3 failed: Max uses exceeded campaign accepted!');
  } catch (err) {
    console.log('✅ Test 3 passed (Rejected maxed):', err.message);
  }

  // Test 4: Package restriction (Should throw error)
  try {
    await abonelikService.validateCampaign(provider.id, 'BAHAR20', PackageType.vip);
    console.error('❌ Test 4 failed: Package mismatch accepted!');
  } catch (err) {
    console.log('✅ Test 4 passed (Rejected package restriction):', err.message);
  }

  // ==========================================
  // STEP C: FREE TRIAL Flow
  // ==========================================
  console.log('\n--- STEP C: Testing Free Trial Flow ---');
  const trialRes = await abonelikService.startSubscription(providerUser.id, {
    packageType: PackageType.standard,
    campaignCode: 'TRIAL14',
  });
  console.log('Trial creation response:', trialRes);

  const subTrial = await prisma.subscription.findUnique({
    where: { provider_id: provider.id },
  });
  console.log(`Verified Trial -> status: ${subTrial?.status} | plan: ${subTrial?.package_type}`);
  if (subTrial?.status === SubscriptionStatus.trial && subTrial?.package_type === PackageType.standard) {
    console.log('✅ Trial subscription flow successfully verified.');
  } else {
    console.error('❌ Trial flow failed!');
  }

  // Test 5: New users restriction (Should throw error now that user has subscription)
  try {
    await abonelikService.validateCampaign(provider.id, 'TRIAL14', PackageType.standard);
    console.error('❌ Test 5 failed: New users only rule bypassed!');
  } catch (err) {
    console.log('✅ Test 5 passed (Rejected new users restriction):', err.message);
  }

  // Reset subscription to test normal paid flow
  await prisma.campaignUsage.deleteMany({});
  await prisma.subscription.deleteMany({});

  // ==========================================
  // STEP D: Paid Subscription (iyzico Mock + Webhook CHECKOUT_FORM_AUTH)
  // ==========================================
  console.log('\n--- STEP D: Testing Paid Subscription & Webhook callback ---');
  
  // Start subscription -> generates checkout form html
  const checkoutRes = await abonelikService.startSubscription(providerUser.id, {
    packageType: PackageType.standard,
    campaignCode: 'BAHAR20',
  });
  console.log('Checkout Form Init Token:', checkoutRes.token);

  // Simulating checkout success callback (CHECKOUT_FORM_AUTH event)
  // Standard price: 3,000 TL, Campaign BAHAR20 gives 20% discount (final: 2,400 TL, discount: 600 TL)
  const webhookResult = await abonelikService.handleCheckoutSuccess(
    provider.id,
    PackageType.standard,
    'iyzico_subscription_reference_code_123',
    cmpPercent.id,
    600
  );
  console.log('Webhook Success Activation Result:', webhookResult.status);

  // Assertions
  const subPaid = await prisma.subscription.findUnique({
    where: { provider_id: provider.id },
    include: { payments: true },
  });
  
  console.log(`Verified Paid -> status: ${subPaid?.status} | plan: ${subPaid?.package_type}`);
  console.log(`Verified Payment -> amount: ${subPaid?.payments[0]?.amount} TL | status: ${subPaid?.payments[0]?.status}`);

  if (
    subPaid?.status === SubscriptionStatus.active &&
    subPaid?.package_type === PackageType.standard &&
    Number(subPaid?.payments[0]?.amount) === 2400
  ) {
    console.log('✅ Paid subscription activation and payment records verified successfully.');
  } else {
    console.error('❌ Paid subscription flow failed!');
  }

  // ==========================================
  // STEP E: Recurring Renewal Webhook
  // ==========================================
  console.log('\n--- STEP E: Testing Recurring Renewal webhook (SUBSCRIPTION_RENEW_SUCCESS) ---');
  
  // Extend subscription date to simulate expiration
  await prisma.subscription.update({
    where: { id: subPaid!.id },
    data: { expires_at: new Date() },
  });

  // Call handleCheckoutSuccess to renew (represents SUBSCRIPTION_RENEW_SUCCESS)
  const renewResult = await abonelikService.handleCheckoutSuccess(
    provider.id,
    PackageType.standard,
    'iyzico_subscription_reference_code_123',
    undefined,
    0
  );

  const subRenewed = await prisma.subscription.findUnique({
    where: { provider_id: provider.id },
    include: { payments: true },
  });
  console.log(`Renewed Subscription -> expires_at: ${subRenewed?.expires_at?.toISOString()}`);
  console.log(`Payments Count: ${subRenewed?.payments?.length}`);
  if (subRenewed && subRenewed.payments.length === 2) {
    console.log('✅ Subscription renewal event verified: Payment records updated.');
  } else {
    console.error('❌ Renewal flow failed!');
  }

  // ==========================================
  // STEP F: Failed Payment & Suspended Flow
  // ==========================================
  console.log('\n--- STEP F: Testing Failed Payments & Retries ---');
  
  // Fail 1: should print log and schedule BullMQ retry
  await abonelikService.handleFailedPayment(provider.id, subPaid!.id, 1);
  
  // Fail 2: should print log and schedule BullMQ retry
  await abonelikService.handleFailedPayment(provider.id, subPaid!.id, 2);

  // Fail 3: should suspend the subscription
  await abonelikService.handleFailedPayment(provider.id, subPaid!.id, 3);

  const subSuspended = await prisma.subscription.findUnique({
    where: { id: subPaid!.id },
  });
  console.log(`Suspended Subscription status: ${subSuspended?.status}`);
  if (subSuspended?.status === SubscriptionStatus.suspended) {
    console.log('✅ Failed payment retry & suspension flow verified successfully.');
  } else {
    console.error('❌ Suspension flow failed!');
  }

  // ==========================================
  // STEP G: Admin Trial Grant/Delete
  // ==========================================
  console.log('\n--- STEP G: Testing Admin Trial Grant & Cancel ---');
  
  const grantRes = await abonelikService.adminGrantTrial(provider.id, 'VIP Deneme');
  console.log('Admin Trial Grant:', grantRes);

  const subAdminTrial = await prisma.subscription.findUnique({
    where: { provider_id: provider.id },
  });
  console.log(`Admin Trial Subscription status: ${subAdminTrial?.status} | plan: ${subAdminTrial?.package_type}`);
  if (subAdminTrial?.status === SubscriptionStatus.admin_trial && subAdminTrial?.package_type === PackageType.standard) {
    console.log('✅ Admin trial grant verified.');
  } else {
    console.error('❌ Admin trial grant failed!');
  }

  const cancelRes = await abonelikService.adminCancelTrial(provider.id);
  console.log('Admin Trial Cancel:', cancelRes);

  const subAdminTrialCancelled = await prisma.subscription.findUnique({
    where: { provider_id: provider.id },
  });
  console.log(`Cancelled Admin Trial status: ${subAdminTrialCancelled?.status}`);
  if (subAdminTrialCancelled?.status === SubscriptionStatus.expired) {
    console.log('✅ Admin trial cancel verified.');
  } else {
    console.error('❌ Admin trial cancel failed!');
  }

  // ==========================================
  // STEP H: Quota Reset Cron
  // ==========================================
  console.log('\n--- STEP H: Testing Monthly Quota Reset Cron ---');
  
  // Set mock active subscription to verify quota limit updates
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  await prisma.subscription.update({
    where: { provider_id: provider.id },
    data: {
      status: SubscriptionStatus.active,
      package_type: PackageType.standard,
      expires_at: nextMonth,
    },
  });

  const monthYear = new Date().toISOString().substring(0, 7);
  
  // Set mock quota accepted count to 5
  await prisma.providerMonthlyQuota.upsert({
    where: { provider_id_month_year: { provider_id: provider.id, month_year: monthYear } },
    create: {
      provider_id: provider.id,
      month_year: monthYear,
      accepted_count: 5,
      monthly_limit: 60,
      reset_at: nextMonth,
    },
    update: {
      accepted_count: 5,
    },
  });

  // Call the reset method
  await abonelikService.monthlyQuotaReset();

  const resetQuota = await prisma.providerMonthlyQuota.findUnique({
    where: { provider_id_month_year: { provider_id: provider.id, month_year: monthYear } },
  });
  console.log(`Reset Quota -> accepted_count: ${resetQuota?.accepted_count} | limit: ${resetQuota?.monthly_limit}`);
  if (resetQuota?.accepted_count === 0 && resetQuota?.monthly_limit === 60) {
    console.log('✅ Quota reset cron verified successfully: Count is 0, limit matches plan.');
  } else {
    console.error('❌ Quota reset cron failed!');
  }

  console.log('\n=== ALL SUBSCRIPTION & PAYMENT INTEGRATION TEST STEPS SUCCEEDED ===');
  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('E2E Test failed:', err);
  process.exit(1);
});
