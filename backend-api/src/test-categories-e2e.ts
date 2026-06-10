import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { ChatService } from './ortak/chat/chat.service';
import { RedisService } from './common/redis/redis.service';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING FAZ 2 CATEGORY EXPANSION E2E TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const prisma = app.get(PrismaService);
  const chatService = app.get(ChatService);
  const redis = app.get(RedisService);

  // 2. Verify all 6 categories are active in DB
  console.log('\n--- STEP 1: Verifying active categories ---');
  const activeCategories = await prisma.category.findMany({
    where: { isActive: true },
  });
  console.log(`Active categories in database: ${activeCategories.length}`);
  for (const cat of activeCategories) {
    console.log(`- Category: ${cat.name}`);
  }

  const activeNames = activeCategories.map((c) => c.name);
  const expectedNames = [
    'Ev Temizliği',
    'Boya Badana',
    'Nakliyat / Ev Taşıma',
    'Su Tesisatı',
    'Elektrik Tesisatı',
    'Ev Tadilat',
  ];

  const missing = expectedNames.filter((name) => !activeNames.includes(name));
  if (missing.length === 0) {
    console.log('✅ Success: All 6 Phase 1 categories are active in the database!');
  } else {
    console.error(`❌ Error: Missing active categories: ${missing.join(', ')}`);
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
    } else {
      console.error(`❌ Error: Job was not saved to database!`);
      await app.close();
      process.exit(1);
    }
  };

  // --- SCENARIO 1: Boya Badana ---
  const boyaSess = `boya-test-${Date.now()}`;
  await simulateChat('Boya Badana Flow', boyaSess, [
    { input: 'boya badana usta arıyorum', expectedStep: 'collecting_details' },
    { input: 'Beşiktaş', expectedStep: 'collecting_details' },
    { input: '120 metrekare', expectedStep: 'collecting_details' },
    { input: 'iç mekan boyası', expectedStep: 'collecting_details' },
    { input: 'Saten beyaz boya', expectedStep: 'ask_details' },
    { input: 'Yok', expectedStep: 'ask_name' },
    { input: 'Ali Müşteri', expectedStep: 'ask_phone' },
    { input: '05321234561', expectedStep: 'otp_verification' },
    { input: 'OTP_CODE', expectedStep: 'confirm_form' },
    { input: 'Onayla', expectedStep: 'completed' },
  ]);

  // --- SCENARIO 2: Nakliyat ---
  const nakSess = `nakliyat-test-${Date.now()}`;
  await simulateChat('Nakliyat Flow', nakSess, [
    { input: 'nakliye lazım eşya taşıyacağım', expectedStep: 'collecting_details' },
    { input: 'Kadıköy', expectedStep: 'collecting_details' },
    { input: 'Ataşehir', expectedStep: 'collecting_details' },
    { input: '2+1 daire', expectedStep: 'collecting_details' },
    { input: '5. kat asansörsüz', expectedStep: 'collecting_details' },
    { input: '1 Haziran', expectedStep: 'ask_details' },
    { input: 'Yok', expectedStep: 'ask_name' },
    { input: 'Ahmet Taşımacı', expectedStep: 'ask_phone' },
    { input: '05331234562', expectedStep: 'otp_verification' },
    { input: 'OTP_CODE', expectedStep: 'confirm_form' },
    { input: 'Onayla', expectedStep: 'completed' },
  ]);

  // --- SCENARIO 3: Su Tesisatı (Smart Multi-parameter Parsing) ---
  const suSess = `su-test-${Date.now()}`;
  await simulateChat('Su Tesisatı Smart Parsing Flow', suSess, [
    { input: 'Şişli\'de kombi tesisatında acil su sızıntısı var musluk arızası', expectedStep: 'ask_details' }, // parsed all in one
    { input: 'Yok', expectedStep: 'ask_name' },
    { input: 'Ayşe Tesisatçı', expectedStep: 'ask_phone' },
    { input: '05341234563', expectedStep: 'otp_verification' },
    { input: 'OTP_CODE', expectedStep: 'confirm_form' },
    { input: 'Onayla', expectedStep: 'completed' },
  ]);

  // --- SCENARIO 4: Elektrik Tesisatı ---
  const elekSess = `elek-test-${Date.now()}`;
  await simulateChat('Elektrik Tesisatı Flow', elekSess, [
    { input: 'elektrik tesisatı işi var', expectedStep: 'collecting_details' },
    { input: 'Bakırköy', expectedStep: 'collecting_details' },
    { input: 'yeni priz ve sigorta onarımı', expectedStep: 'collecting_details' },
    { input: 'acil hemen', expectedStep: 'ask_details' },
    { input: 'Yok', expectedStep: 'ask_name' },
    { input: 'Mehmet Elektrik', expectedStep: 'ask_phone' },
    { input: '05351234564', expectedStep: 'otp_verification' },
    { input: 'OTP_CODE', expectedStep: 'confirm_form' },
    { input: 'Onayla', expectedStep: 'completed' },
  ]);

  // --- SCENARIO 5: Ev Tadilat ---
  const tadSess = `tadilat-test-${Date.now()}`;
  await simulateChat('Ev Tadilatı Flow', tadSess, [
    { input: 'ev tadilat ustası arıyorum', expectedStep: 'collecting_details' },
    { input: 'Üsküdar', expectedStep: 'collecting_details' },
    { input: 'banyo yenileme fayans dahil', expectedStep: 'collecting_details' },
    { input: '15 metrekare', expectedStep: 'collecting_details' },
    { input: 'bütçe 50-100 bin arası', expectedStep: 'ask_details' },
    { input: 'Yok', expectedStep: 'ask_name' },
    { input: 'Fatma Tadilat', expectedStep: 'ask_phone' },
    { input: '05361234565', expectedStep: 'otp_verification' },
    { input: 'OTP_CODE', expectedStep: 'confirm_form' },
    { input: 'Onayla', expectedStep: 'completed' },
  ]);

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL FAZ 2 CATEGORY E2E TESTS PASSED SUCCESSFULLY 🎉 ===');
  console.log('===========================================================');

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Category E2E test failed:', err);
  process.exit(1);
});
