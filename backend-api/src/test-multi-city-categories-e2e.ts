import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { ChatService } from './ortak/chat/chat.service';
import { RedisService } from './common/redis/redis.service';
import { TaleplerProcessor } from './musteri/talepler/talepler.processor';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING FAZ 3 ADANA LAUNCH & DISTRICT MATCHING E2E ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const prisma = app.get(PrismaService);
  const chatService = app.get(ChatService);
  const redis = app.get(RedisService);
  const distributionProcessor = app.get(TaleplerProcessor);

  // --- TEST 1: CATEGORY ACTIVATION VERIFICATION ---
  console.log('\n--- TEST 1: Verifying active categories ---');
  const activeCategories = await prisma.category.findMany({
    where: { isActive: true },
  });
  console.log(`Active categories in database: ${activeCategories.length}`);
  
  if (activeCategories.length >= 14) {
    console.log('✅ Success: All service categories are active in the database!');
  } else {
    console.error('❌ Error: Expected at least 14 active categories.');
    await app.close();
    process.exit(1);
  }

  // Helper function to simulate a multi-turn chat conversation
  const simulateChat = async (scenarioName: string, sessionId: string, turns: { input: string; expectedStep: string }[]) => {
    console.log(`\n--- SCENARIO: ${scenarioName} ---`);
    await chatService.startAnonymousSession(sessionId);

    let lastRes: any = null;
    let userId: string | null = null;

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      let turnInput = turn.input;

      // In OTP step, if input is 'OTP_CODE', fetch the generated OTP from Redis
      if (turn.expectedStep === 'confirm_form' && turnInput === 'OTP_CODE') {
        const phone = lastRes.collected_data.phone;
        const otpData = await redis.get(`otp:${phone}`);
        if (otpData) {
          const { code } = JSON.parse(otpData);
          turnInput = code;
        }
      }

      // If session was migrated, use the returned user ID
      if (lastRes?.userId) {
        userId = lastRes.userId;
      }

      console.log(`[USER]: "${turnInput}"`);
      lastRes = await chatService.handleMessage(userId, sessionId, turnInput);
      console.log(`[AI] (Step: ${lastRes.step}): ${lastRes.responseMessage.substring(0, 150)}...`);

      if (lastRes.step === turn.expectedStep) {
        console.log(`  ✅ Correct Step: ${lastRes.step}`);
      } else {
        console.error(`  ❌ Error: Expected step ${turn.expectedStep} but got ${lastRes.step}`);
        await app.close();
        process.exit(1);
      }
    }

    // Verify job created in DB and form_data saved correctly
    const latestJob = await prisma.serviceRequest.findFirst({
      where: { seeker: { name: lastRes.collected_data.name } },
      orderBy: { created_at: 'desc' },
      include: { category: true },
    });

    if (latestJob) {
      console.log(`✅ Success: Request created in database successfully!`);
      console.log(`  Job ID: ${latestJob.id}`);
      console.log(`  Category: ${latestJob.category.name}`);
      console.log(`  Saved Form Data:`, JSON.stringify(latestJob.form_data));
      return latestJob;
    } else {
      console.error(`❌ Error: Job was not saved to database!`);
      await app.close();
      process.exit(1);
    }
  };

  // --- TEST 2: ADANA ÇUKUROVA LOCATION & HAŞERE İLAÇLAMA FLOW ---
  const cukurovaSess = `cukurova-test-${Date.now()}`;
  const cukurovaJob = await simulateChat('Adana Çukurova Haşere İlaçlama (Smart Location & Parsing)', cukurovaSess, [
    { input: "Adana Çukurova'da evimde hamam böceği ilaçlaması yaptırmak istiyorum.", expectedStep: 'ask_name' },
    { input: "Mehmet Adana", expectedStep: 'ask_phone' },
    { input: "05351234567", expectedStep: 'otp_verification' },
    { input: "OTP_CODE", expectedStep: 'confirm_form' },
    { input: "Onayla", expectedStep: 'completed' }
  ]);

  // Assert location and city boundaries
  const cukurovaFormData = cukurovaJob.form_data as any;
  if (cukurovaFormData.city === 'Adana' && cukurovaFormData.district === 'Çukurova' && cukurovaFormData.hasereTuru === 'Hamam Böceği' && cukurovaFormData.binaTipi === 'Daire / Ev') {
    console.log('✅ Success: Smart Location Resolution verified city as Adana and district as Çukurova along with dynamic parameters!');
  } else {
    console.error('❌ Error: Adana location parsing failed. Form Data:', cukurovaFormData);
    await app.close();
    process.exit(1);
  }

  // --- TEST 3: ADANA SEYHAN LOCATION & ÖZEL DERS FLOW ---
  const seyhanSess = `seyhan-test-${Date.now()}`;
  const seyhanJob = await simulateChat('Adana Seyhan Özel Ders Flow', seyhanSess, [
    { input: "Adana Seyhan'da lise düzeyinde matematik özel dersi almak istiyorum.", expectedStep: 'ask_name' },
    { input: "Selin Adana", expectedStep: 'ask_phone' },
    { input: "05361234568", expectedStep: 'otp_verification' },
    { input: "OTP_CODE", expectedStep: 'confirm_form' },
    { input: "Onayla", expectedStep: 'completed' }
  ]);

  // Assert location and city boundaries
  const seyhanFormData = seyhanJob.form_data as any;
  if (seyhanFormData.city === 'Adana' && seyhanFormData.district === 'Seyhan' && seyhanFormData.dersTuru === 'Matematik' && seyhanFormData.sinifSeviyesi === 'Lise (YKS Hazırlık)') {
    console.log('✅ Success: Smart Location Resolution verified city as Adana and district as Seyhan along with Özel Ders parameters!');
  } else {
    console.error('❌ Error: Adana Seyhan location parsing failed. Form Data:', seyhanFormData);
    await app.close();
    process.exit(1);
  }

  // --- TEST 4: MULTI-DISTRICT BOUNDARY FILTERING ---
  console.log('\n--- TEST 4: Verifying Multi-District Boundary Filtering ---');

  const providerCategory = cukurovaJob.category_id; // 'Haşere & Böcek İlaçlama'

  // User 1
  const uUser1 = await prisma.user.upsert({
    where: { phone: 'encrypted_phone_seyhan_provider' },
    update: { is_active: true },
    create: {
      phone: 'encrypted_phone_seyhan_provider',
      phone_masked: '0599***9901',
      name: 'Seyhan Usta (Seyhan Only)',
      role: 'service_provider',
      is_active: true,
      kvkk_consent: true,
    }
  });

  // Create Provider 1 (Seyhan Only)
  const providerSeyhan = await prisma.serviceProvider.upsert({
    where: { id: '33333333-3333-3333-3333-333333333333' },
    update: { category_ids: [providerCategory], is_approved: true, avg_rating: 4.5, city: 'Adana', service_districts: ['Seyhan'] },
    create: {
      id: '33333333-3333-3333-3333-333333333333',
      user_id: uUser1.id,
      category_ids: [providerCategory],
      is_approved: true,
      avg_rating: 4.5,
      city: 'Adana',
      service_districts: ['Seyhan']
    }
  });

  // User 2
  const uUser2 = await prisma.user.upsert({
    where: { phone: 'encrypted_phone_cukurova_provider' },
    update: { is_active: true },
    create: {
      phone: 'encrypted_phone_cukurova_provider',
      phone_masked: '0599***9902',
      name: 'Cukurova Usta (Cukurova Only)',
      role: 'service_provider',
      is_active: true,
      kvkk_consent: true,
    }
  });

  // Create Provider 2 (Çukurova Only)
  const providerCukurova = await prisma.serviceProvider.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: { category_ids: [providerCategory], is_approved: true, avg_rating: 4.5, city: 'Adana', service_districts: ['Çukurova'] },
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      user_id: uUser2.id,
      category_ids: [providerCategory],
      is_approved: true,
      avg_rating: 4.5,
      city: 'Adana',
      service_districts: ['Çukurova']
    }
  });

  // Clear previous response times for cleaner testing
  await prisma.responseTime.deleteMany({
    where: { job_id: { in: [cukurovaJob.id, seyhanJob.id] } }
  });

  // Run Distribution simulation for Çukurova Job
  console.log(`Running distribution for Çukurova Job ID: ${cukurovaJob.id}...`);
  const mockJob = { data: { jobId: cukurovaJob.id } } as any;
  await distributionProcessor.handleDistribution(mockJob);

  // Check notified providers in DB
  const notified = await prisma.responseTime.findMany({
    where: { job_id: cukurovaJob.id },
    select: { provider_id: true }
  });

  const notifiedIds = notified.map((n) => n.provider_id);
  console.log('Notified Provider IDs:', notifiedIds);

  const containsCukurova = notifiedIds.includes(providerCukurova.id);
  const containsSeyhan = notifiedIds.includes(providerSeyhan.id);

  if (containsCukurova && !containsSeyhan) {
    console.log('✅ Success: Smart municipal boundary filtering verified! Çukurova job was only distributed to Çukurova provider, and Seyhan provider was correctly excluded!');
  } else {
    console.error('❌ Error: District boundary filtering failed! Notified IDs list does not match expectations.');
    await app.close();
    process.exit(1);
  }

  console.log('\n===========================================================');
  console.log('🎉 🎉 ALL FAZ 3 ADANA LAUNCH & DISTRICT MATCHING TESTS PASSED! 🎉 🎉');
  console.log('===========================================================');

  await app.close();
}

run().catch((e) => {
  console.error('E2E Test Execution Failed:', e);
  process.exit(1);
});
