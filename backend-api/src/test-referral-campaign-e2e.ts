import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { ReferralService } from './ortak/referral/referral.service';
import { AbonelikService } from './hizmetveren/abonelik/abonelik.service';
import { JobCompletionService } from './ortak/job-completion/job-completion.service';
import { ReferralType, PackageType, CampaignType, SubscriptionStatus, PaymentStatus, JobCompletionStatus } from '@prisma/client';
import { encryptPhone, maskPhone } from './common/utils/phone.util';

async function runE2eTests() {
  console.log('--- STARTING REFERRAL & CAMPAIGN MOTORU E2E TESTS ---');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const referralService = app.get(ReferralService);
  const abonelikService = app.get(AbonelikService);
  const completionService = app.get(JobCompletionService);

  try {
    // 0. Test verilerini temizle
    await prisma.$executeRawUnsafe('TRUNCATE TABLE referrals, campaigns, campaign_usage, provider_monthly_quota, subscriptions, payments, job_completions, call_tasks, phone_reveal_logs, accepted_offers, offers, service_requests, service_providers, users CASCADE');

    console.log('[Test Setup] Database cleared successfully.');

    // 1. HA-1 ve HA-2 Müşterilerini tohumla
    const ha1Phone = '+905330000001';
    const ha2Phone = '+905330000002';
    
    const ha1 = await prisma.user.create({
      data: {
        phone: encryptPhone(ha1Phone),
        phone_masked: maskPhone(ha1Phone),
        name: 'Ali Seeker',
        role: 'service_seeker',
        kvkk_consent: true,
      },
    });

    const ha2 = await prisma.user.create({
      data: {
        phone: encryptPhone(ha2Phone),
        phone_masked: maskPhone(ha2Phone),
        name: 'Veli Seeker',
        role: 'service_seeker',
        kvkk_consent: true,
      },
    });

    // 2. HV-1 ve HV-2 Hizmet Verenlerini tohumla
    const hv1Phone = '+905320000001';
    const hv2Phone = '+905320000002';

    const hv1User = await prisma.user.create({
      data: {
        phone: encryptPhone(hv1Phone),
        phone_masked: maskPhone(hv1Phone),
        name: 'Mehmet Usta',
        role: 'service_provider',
        kvkk_consent: true,
      },
    });

    const hv1 = await prisma.serviceProvider.create({
      data: {
        user_id: hv1User.id,
        is_approved: true,
        approved_at: new Date(),
      },
    });

    const hv2User = await prisma.user.create({
      data: {
        phone: encryptPhone(hv2Phone),
        phone_masked: maskPhone(hv2Phone),
        name: 'Hasan Usta',
        role: 'service_provider',
        kvkk_consent: true,
      },
    });

    const hv2 = await prisma.serviceProvider.create({
      data: {
        user_id: hv2User.id,
        is_approved: true,
        approved_at: new Date(),
      },
    });

    console.log('[Test 1] Users and Providers seeded.');

    // --- TEST 1: Referans Kodu Üretme ---
    const ha1Code = await referralService.getOrCreateReferralCode(ha1.id);
    const hv1Code = await referralService.getOrCreateReferralCode(hv1User.id);

    console.log(`[Test 1] Generated HA-1 Code: ${ha1Code} (Expected: ALIS[uuid])`);
    console.log(`[Test 1] Generated HV-1 Code: ${hv1Code} (Expected: MEHM[uuid])`);

    if (!ha1Code.startsWith('ALIS') || !hv1Code.startsWith('MEHM')) {
      throw new Error('Deterministik referans kodu üretimi hatalı.');
    }
    console.log('✔ Test 1 (Referral Code Generation) passed.');

    // --- TEST 2: Kodu girme ve Referans İlişkisi kurma ---
    // HA-2, HA-1'in kodunu girer
    await referralService.applyReferralCode(ha2.id, ha1Code);
    
    // HV-2, HV-1'in kodunu girer
    await referralService.applyReferralCode(hv2User.id, hv1Code);

    // Eşleşmeleri veritabanından çekip doğrula
    const haReferral = await prisma.referral.findUnique({
      where: { referee_id: ha2.id },
    });

    const hvReferral = await prisma.referral.findUnique({
      where: { referee_id: hv2User.id },
    });

    if (!haReferral || haReferral.referrer_id !== ha1.id || haReferral.type !== ReferralType.seeker_credit) {
      throw new Error('HA referans eşleşmesi kaydedilemedi.');
    }

    if (!hvReferral || hvReferral.referrer_id !== hv1User.id || hvReferral.type !== ReferralType.provider_discount) {
      throw new Error('HV referans eşleşmesi kaydedilemedi.');
    }

    console.log('✔ Test 2 (Referral Application) passed.');

    // --- TEST 3: Seeker (HA-2) ilk iş bitişi tetiklemesi ve 100 TL balance eklenmesi ---
    // HA-2 adına bir iş simüle et ve tamamla
    const category = await prisma.category.upsert({
      where: { name: 'Ev Temizliği' },
      create: { name: 'Ev Temizliği', isActive: true },
      update: {},
    });

    const request = await prisma.serviceRequest.create({
      data: {
        seeker_id: ha2.id,
        category_id: category.id,
        form_data: { details: 'Simüle ev temizliği işi.' },
        status: 'completed',
      },
    });

    const offer = await prisma.offer.create({
      data: {
        job_id: request.id,
        provider_id: hv1.id,
        price: 3000,
        status: 'accepted',
      },
    });

    await prisma.acceptedOffer.create({
      data: {
        job_id: request.id,
        offer_id: offer.id,
        seeker_id: ha2.id,
        provider_id: hv1.id,
        seeker_consent: true,
      },
    });

    const completion = await prisma.jobCompletion.create({
      data: {
        job_id: request.id,
        offer_id: offer.id,
        provider_id: hv1.id,
        seeker_id: ha2.id,
        provider_declared_amount: 3000,
        provider_confirmed: true,
        status: JobCompletionStatus.pending_seeker,
      },
    });

    // Seeker işi onaylar -> completionService asenkron referans tetikleyiciyi çağırır.
    // Biz burada doğrudan completionService.confirmCompletion tetikleyeceğiz.
    await completionService.confirmCompletion(ha2.id, request.id, {
      confirmed: true,
    });

    // Referans veren HA-1'in balance (kredi) alanını oku
    const ha1Updated = await prisma.user.findUnique({
      where: { id: ha1.id },
    });

    const haReferralUpdated = await prisma.referral.findUnique({
      where: { referee_id: ha2.id },
    });

    console.log(`[Test 3] HA-1 Balance: ${ha1Updated?.balance} TL (Expected: 100.00 TL)`);
    console.log(`[Test 3] HA Referral Rewarded: ${haReferralUpdated?.rewarded}`);

    if (Number(ha1Updated?.balance) !== 100 || !haReferralUpdated?.rewarded) {
      throw new Error('HA referans ödülü balance enjeksiyonu başarısız.');
    }

    console.log('✔ Test 3 (Seeker Referral Reward) passed.');

    // --- TEST 4: Provider (HV-2) ilk paket satın alma tetiklemesi ve 500 TL kampanya kodu üretilmesi ---
    // HV-2 ödemesini simüle et (handleCheckoutSuccess tetiklenir)
    await abonelikService.handleCheckoutSuccess(
      hv2.id,
      PackageType.standard,
      'sub_ref_12345',
      undefined,
      0
    );

    // Referans veren HV-1 adına kampanya kodunun tescillenmesini doğrula
    const campaignCode = `REF-HV-${hv1User.id.substring(0, 6).toUpperCase()}-${hv2User.id.substring(hv2User.id.length - 4).toUpperCase()}`;
    const generatedCampaign = await prisma.campaign.findUnique({
      where: { code: campaignCode },
    });

    const hvReferralUpdated = await prisma.referral.findUnique({
      where: { referee_id: hv2User.id },
    });

    console.log(`[Test 4] Generated Campaign Code: ${generatedCampaign?.code}`);
    console.log(`[Test 4] Campaign Value: ${generatedCampaign?.value} TL (Expected: 500.00)`);
    console.log(`[Test 4] HV Referral Rewarded: ${hvReferralUpdated?.rewarded}`);

    if (!generatedCampaign || Number(generatedCampaign.value) !== 500 || !hvReferralUpdated?.rewarded) {
      throw new Error('HV referans 500 TL indirim kodu üretimi başarısız.');
    }

    console.log('✔ Test 4 (Provider Referral Reward) passed.');

    // --- TEST 5: Ek Kota Hediyesi (quota_bonus) Kampanya Kodu Uygulaması ---
    // quota_bonus tipinde bir kampanya kodu tohumla (+15 ek kota tanımlı)
    const bonusCampaignCode = 'KOTABONUS15';
    await prisma.campaign.create({
      data: {
        name: 'Ek 15 Kota Hediyesi',
        code: bonusCampaignCode,
        type: CampaignType.quota_bonus,
        value: 15,
        valid_from: new Date(),
        valid_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        is_active: true,
        new_users_only: false,
      },
    });

    // Usta bu kod ile abonelik checkout başarısını simüle eder (Abonelik ücreti fixed/indirim etkilenmez ama kota artar)
    const discountAmount = 0; // Kota bonusunda indirim olmaz
    await abonelikService.handleCheckoutSuccess(
      hv1.id,
      PackageType.standard, // Standart paket kotası: 30
      'sub_ref_99999',
      (await prisma.campaign.findUnique({ where: { code: bonusCampaignCode } }))?.id,
      discountAmount
    );

    // Aylık kota kaydını çek ve doğrula (Standart 30 + Hediye 15 = 45 olmalı!)
    const monthYear = new Date().toISOString().substring(0, 7);
    const quota = await prisma.providerMonthlyQuota.findUnique({
      where: { provider_id_month_year: { provider_id: hv1.id, month_year: monthYear } },
    });

    console.log(`[Test 5] Provider 1 Quota Limit: ${quota?.monthly_limit} (Expected: 45)`);

    if (quota?.monthly_limit !== 45) {
      throw new Error('quota_bonus hediye kotası tescili başarısız.');
    }

    console.log('✔ Test 5 (Quota Bonus Campaign) passed.');

    console.log('🎉 --- ALL ADIM 15 REFERRAL & CAMPAIGN MOTORU E2E TESTS PASSED WITH 100% SUCCESS ---');
  } catch (error) {
    console.error('❌ E2E TEST FAILED:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runE2eTests();
