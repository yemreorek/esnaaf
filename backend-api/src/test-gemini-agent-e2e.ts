import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ChatService } from './ortak/chat/chat.service';
import { GeminiService } from './common/gemini/gemini.service';
import { PrismaService } from './common/prisma/prisma.service';
import { RedisService } from './common/redis/redis.service';
import { randomUUID } from 'crypto';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING GEMINI FLASH ACTIVE AGENT E2E INTEGRATION TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const chatService = app.get(ChatService);
  const geminiService = app.get(GeminiService);
  const prisma = app.get(PrismaService);
  const redis = app.get(RedisService);

  const sessionId = randomUUID();
  console.log(`Generated Test Session ID: ${sessionId}`);

  // 2. Clear any dirty state in Redis/Database for testing
  const tempSessionKey = `temp_session:${sessionId}`;
  await redis.del(tempSessionKey);
  await chatService.startAnonymousSession(sessionId);


  // 3. Mock the GeminiService response generation to simulate function calling flows deterministically
  const originalGenerateResponse = geminiService.generateResponse;
  
  // Set isAvailable to true for testing active agent logic
  (geminiService as any).isAvailable = () => true;
  (geminiService as any).ai = {} as any; // Mock Client instance

  let mockTurn = 1;

  geminiService.generateResponse = async (history: any[], systemInstruction: string) => {
    console.log(`[Mock Gemini API] Processing Turn ${mockTurn}. Last prompt: "${history[history.length - 1].content}"`);
    
    if (mockTurn === 1) {
      // Turn 1: Müşteri boya talebinde bulunuyor. Ajan detectCategory çağırmalı.
      return {
        text: '',
        functionCalls: [
          {
            name: 'detectCategory',
            args: { categorySlug: 'boya-badana', confidence: 0.95 },
          },
        ] as any,
      };
    } else if (mockTurn === 2) {
      // Turn 2: Müşteri detayları veriyor. Ajan ad ve telefon istemeli.
      return {
        text: 'Boya detaylarını başarıyla aldım. Şimdi size hitap edebilmemiz için ad-soyad ve telefon numaranızı yazar mısınız?',
        functionCalls: null,
      };
    } else if (mockTurn === 3) {
      // Turn 3: Müşteri kimliğini veriyor. Ajan sendOTP çağırmalı.
      return {
        text: '',
        functionCalls: [
          {
            name: 'sendOTP',
            args: { 
              phone: '05329998877', 
              name: 'Mert Usta Sever',
              formData: {
                city: 'Adana',
                district: 'Çukurova',
                metrekare: '120 m²',
                tur: 'İç mekan',
                renkTip: 'beyaz',
                details: '120 metrekare iç mekan beyaz renk olacak.'
              }
            },
          },
        ] as any,
      };
    }

    return {
      text: 'Size nasıl yardımcı olabilirim?',
      functionCalls: null,
    };
  };

  // --- TURN 1: Initial greeting and category detection ---
  console.log('\n--- TURN 1: Customer requests boya badana and district ---');
  mockTurn = 1;
  const resTurn1 = (await chatService.handleMessage(
    null,
    sessionId,
    'Evimi boyatmak istiyorum, Çukurova civarında 3+1 daire.',
  )) as any;
  console.log('Turn 1 Response:', JSON.stringify(resTurn1));

  if (resTurn1.step === 'collecting_details' && resTurn1.collected_data.categorySlug === 'boya-badana') {
    console.log('✅ Success: Active Agent successfully called detectCategory and stored boya-badana slug!');
  } else {
    console.error('❌ Error: Turn 1 failed. Got:', resTurn1);
    await app.close();
    process.exit(1);
  }

  // --- TURN 2: Customer provides details and district ---
  console.log('\n--- TURN 2: Customer provides painting details (metrekare, tur, renk) ---');
  mockTurn = 2;
  const resTurn2 = (await chatService.handleMessage(
    null,
    sessionId,
    '120 metrekare iç mekan beyaz renk olacak.',
  )) as any;
  console.log('Turn 2 Response:', JSON.stringify(resTurn2));

  // Verify that inline parsing extracted metrekare, tur, renkTip
  const data2 = resTurn2.collected_data;
  if (data2.metrekare === '120 m²' && data2.tur === 'İç mekan' && data2.renkTip && data2.renkTip.includes('beyaz')) {
    console.log('✅ Success: Inline parameter parsing correctly enriched category specific parameters!');
  } else {
    console.error('❌ Error: Inline parsing failed to extract values. Got:', data2);
    await app.close();
    process.exit(1);
  }

  // --- TURN 3: Customer provides name & phone -> triggering OTP ---
  console.log('\n--- TURN 3: Customer provides Name and Phone ---');
  mockTurn = 3;
  const resTurn3 = (await chatService.handleMessage(
    null,
    sessionId,
    'Ben Mert Usta Sever, cep telefonum 0532 999 88 77',
  )) as any;
  console.log('Turn 3 Response:', JSON.stringify(resTurn3));

  if (resTurn3.step === 'otp_verification' && resTurn3.collected_data.phone === '+905329998877') {
    console.log('✅ Success: Active Agent successfully called sendOTP and shifted to otp_verification!');
  } else {
    console.error('❌ Error: sendOTP flow failed. Got:', resTurn3);
    await app.close();
    process.exit(1);
  }

  // --- TURN 4: Fetch OTP and submit code ---
  console.log('\n--- TURN 4: Fetch OTP code from Redis and verify ---');
  const otpData = await redis.get('otp:+905329998877');
  if (!otpData) {
    console.error('❌ Error: Expected OTP code to be stored in Redis under otp:+905329998877');
    await app.close();
    process.exit(1);
  }
  const { code } = JSON.parse(otpData);
  console.log(`Found OTP Code in Redis: ${code}`);

  // Submit correct code
  const resTurn4 = (await chatService.handleMessage(null, sessionId, code)) as any;
  console.log('Turn 4 Response:', JSON.stringify(resTurn4));

  if (resTurn4.step === 'confirm_form' && resTurn4.userId) {
    console.log('✅ Success: OTP verification completed, user registered, and session migrated successfully!');
  } else {
    console.error('❌ Error: OTP verification step failed. Got:', resTurn4);
    await app.close();
    process.exit(1);
  }

  // --- TURN 5: Confirm Service Request ---
  console.log('\n--- TURN 5: Customer confirms request with Sadece Favoriler checked ---');
  const authSessionId = sessionId;
  const authUserId = resTurn4.userId;

  const resTurn5 = (await chatService.handleMessage(
    authUserId,
    authSessionId,
    'Onayla - Sadece Favori Ustalarima Gonder',
  )) as any;
  console.log('Turn 5 Response:', JSON.stringify(resTurn5));

  if (resTurn5.step === 'completed' && resTurn5.responseMessage.includes('Tebrikler! Talebiniz başarıyla gönderildi')) {
    console.log('✅ Success: Service Request confirmed and finalized successfully!');
  } else {
    console.error('❌ Error: Service Request confirmation step failed. Got:', resTurn5);
    await app.close();
    process.exit(1);
  }

  // --- DB VERIFICATION: Validate sendToFavoritesOnly was saved correctly ---
  console.log('\n--- VERIFICATION: Checking Prisma DB for created Service Request details ---');
  const latestRequest = await prisma.serviceRequest.findFirst({
    where: { seeker_id: authUserId },
    orderBy: { created_at: 'desc' },
  });

  if (latestRequest && latestRequest.status === 'pending') {
    const formData = latestRequest.form_data as any;
    console.log('Found Service Request in DB. Form Data:', JSON.stringify(formData));
    
    if (formData.sendToFavoritesOnly === true && formData.metrekare && formData.metrekare.includes('m²') && formData.district === 'Çukurova') {
      console.log('✅ Success: DB verification passed! sendToFavoritesOnly check and metrekare values are fully preserved!');
    } else {
      console.error('❌ Error: DB Form Data values are incorrect:', formData);
      await app.close();
      process.exit(1);
    }
  } else {
    console.error('❌ Error: Expected ServiceRequest not found in DB or status incorrect.');
    await app.close();
    process.exit(1);
  }

  // 4. Restore mock
  geminiService.generateResponse = originalGenerateResponse;

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL GEMINI ACTIVE AGENT E2E TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
  process.exit(0);
}

run().catch(async (e) => {
  console.error('❌ E2E Active Agent Test execution failed:', e);
  process.exit(1);
});
