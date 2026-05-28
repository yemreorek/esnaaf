import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { UploadService } from './ortak/upload/upload.service';
import { ChatService } from './ortak/chat/chat.service';
import { RedisService } from './common/redis/redis.service';
import { validate } from 'class-validator';
import { PresignedUrlDto } from './ortak/upload/dto/presigned-url.dto';
import { randomUUID } from 'crypto';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING UPLOAD AND 20 CATEGORIES E2E INTEGRATION TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const prisma = app.get(PrismaService);
  const uploadService = app.get(UploadService);
  const chatService = app.get(ChatService);
  const redis = app.get(RedisService);

  // 2. Test Presigned URL Generation and safe DTO MIME validation
  console.log('\n--- TEST 1: S3/R2 Presigned URL Generation ---');
  const testUserId = randomUUID();
  const res = await uploadService.generatePresignedUrl(testUserId, 'fatura_taslagi.pdf', 'application/pdf');
  
  console.log('Upload URL generated:', res.uploadUrl);
  console.log('File URL generated:', res.fileUrl);
  console.log('Unique Key generated:', res.key);

  if (res.uploadUrl.includes('fatura_taslagi.pdf') && (res.fileUrl.includes('platform-documents') || res.fileUrl.includes('storage/uploads'))) {
    console.log('✅ Success: Presigned S3/R2 mock URL generated with safe keys!');
  } else {
    console.error('❌ Error: Presigned S3/R2 URL layout mismatch.');
    await app.close();
    process.exit(1);
  }

  // 3. Test DTO Class-Validator validation rules
  console.log('\n--- TEST 2: PresignedUrlDto MIME Validation Rules ---');
  
  const validDto = new PresignedUrlDto();
  validDto.fileName = 'profil.png';
  validDto.contentType = 'image/png';
  const errors1 = await validate(validDto);
  if (errors1.length === 0) {
    console.log('✅ Success: Safe type image/png accepted by DTO class-validator.');
  } else {
    console.error('❌ Error: DTO rejected a valid safe MIME type.');
    await app.close();
    process.exit(1);
  }

  const invalidDto = new PresignedUrlDto();
  invalidDto.fileName = 'zararli_kod.exe';
  invalidDto.contentType = 'application/x-msdownload';
  const errors2 = await validate(invalidDto);
  if (errors2.length > 0) {
    console.log('✅ Success: Unsafe type application/x-msdownload correctly REJECTED by DTO validation!');
    console.log('  Validation error msg:', errors2[0].constraints);
  } else {
    console.error('❌ Error: DTO accepted an unsafe MIME type.');
    await app.close();
    process.exit(1);
  }

  // 4. Verify all 20 categories are active in DB
  console.log('\n--- TEST 3: Verifying all 20 categories are active ---');
  const activeCategories = await prisma.category.findMany({
    where: { isActive: true },
  });
  console.log(`Total active categories in database: ${activeCategories.length}`);
  
  if (activeCategories.length === 20) {
    console.log('✅ Success: All 20 categories are fully activated in the database!');
  } else {
    console.error(`❌ Error: Expected 20 active categories, but found: ${activeCategories.length}`);
    await app.close();
    process.exit(1);
  }

  // 5. Test Faz 3 Categories AI Chat Akışı Turn-by-Turn
  const simulateChat = async (scenarioName: string, sessionId: string, turns: { input: string; expectedStep: string }[]) => {
    console.log(`\n--- SCENARIO: ${scenarioName} ---`);
    await chatService.startAnonymousSession(sessionId);

    let lastRes: any = null;
    let userId: string | null = null;

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      let turnInput = turn.input;

      if (turn.expectedStep === 'confirm_form' && turnInput === 'OTP_CODE') {
        const phone = lastRes.collected_data.phone;
        const otpData = await redis.get(`otp:${phone}`);
        if (otpData) {
          const { code } = JSON.parse(otpData);
          turnInput = code;
        }
      }

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
      console.error(`❌ Error: Seeker request not saved to database.`);
      await app.close();
      process.exit(1);
    }
  };

  // Turn-by-Turn chat scenarios for the 6 new categories
  
  // 1. Cam Balkon & PVC Pencere Flow
  await simulateChat(
    'Cam Balkon & PVC Pencere Flow',
    randomUUID(),
    [
      { input: "Kadıköy'de pvc pencere değişimi ve cam balkon yaptırmak istiyorum", expectedStep: "collecting_details" },
      { input: "3 adet cam", expectedStep: "collecting_details" },
      { input: "ısıcam çift cam olsun", expectedStep: "ask_name" },
      { input: "Can Balkoncu", expectedStep: "ask_phone" },
      { input: "05391112233", expectedStep: "otp_verification" },
      { input: "OTP_CODE", expectedStep: "confirm_form" },
      { input: "evet", expectedStep: "completed" },
    ]
  );

  // 2. Ofis & İş Yeri Temizliği Flow
  await simulateChat(
    'Ofis & İş Yeri Temizliği Flow',
    randomUUID(),
    [
      { input: "Beşiktaş'ta ofis temizliği lazım", expectedStep: "collecting_details" },
      { input: "120 metrekare ofis", expectedStep: "collecting_details" },
      { input: "Haftalık düzenli temizlik", expectedStep: "ask_name" },
      { input: "Kemal Ofisçi", expectedStep: "ask_phone" },
      { input: "05391112234", expectedStep: "otp_verification" },
      { input: "OTP_CODE", expectedStep: "confirm_form" },
      { input: "evet", expectedStep: "completed" },
    ]
  );

  // 3. Doğalgaz Tesisatı Flow
  await simulateChat(
    'Doğalgaz Tesisatı Flow',
    randomUUID(),
    [
      { input: "Şişli'de kombi doğalgaz tesisatı döşenecek", expectedStep: "collecting_details" },
      { input: "3+1 daire", expectedStep: "collecting_details" },
      { input: "Kombi dahil komple kurulum", expectedStep: "ask_name" },
      { input: "Deniz Gazcı", expectedStep: "ask_phone" },
      { input: "05391112235", expectedStep: "otp_verification" },
      { input: "OTP_CODE", expectedStep: "confirm_form" },
      { input: "evet", expectedStep: "completed" },
    ]
  );

  // 4. İç Mimar & Dekorasyon Flow
  await simulateChat(
    'İç Mimar & Dekorasyon Flow',
    randomUUID(),
    [
      { input: "Üsküdar'da iç mimar dekorasyon tasarımı arıyorum", expectedStep: "collecting_details" },
      { input: "Salon ve mutfak komple dekorasyon yapılacak", expectedStep: "collecting_details" },
      { input: "Bütçemiz 100.000–200.000 TL arası", expectedStep: "ask_name" },
      { input: "Zeynep Dekor", expectedStep: "ask_phone" },
      { input: "05391112236", expectedStep: "otp_verification" },
      { input: "OTP_CODE", expectedStep: "confirm_form" },
      { input: "evet", expectedStep: "completed" },
    ]
  );

  // 5. Fotoğrafçı Flow
  await simulateChat(
    'Fotoğrafçı Flow',
    randomUUID(),
    [
      { input: "Kadıköy'de düğün fotoğrafçısı arıyoruz çekim için", expectedStep: "collecting_details" },
      { input: "Dış çekim albüm dahil düğün çekimi", expectedStep: "collecting_details" },
      { input: "15 Haziran'da çekilecek", expectedStep: "ask_name" },
      { input: "Murat Albüm", expectedStep: "ask_phone" },
      { input: "05391112237", expectedStep: "otp_verification" },
      { input: "OTP_CODE", expectedStep: "confirm_form" },
      { input: "evet", expectedStep: "completed" },
    ]
  );

  // 6. Organizasyon & Etkinlik Flow
  await simulateChat(
    'Organizasyon & Etkinlik Flow',
    randomUUID(),
    [
      { input: "Beşiktaş'ta nişan organizasyonu için teklif lazım", expectedStep: "collecting_details" },
      { input: "Nişan töreni süslemeleri catering dahil", expectedStep: "collecting_details" },
      { input: "150 kişilik davetli", expectedStep: "collecting_details" },
      { input: "20 Haziran", expectedStep: "ask_name" },
      { input: "Selin Davet", expectedStep: "ask_phone" },
      { input: "05391112238", expectedStep: "otp_verification" },
      { input: "OTP_CODE", expectedStep: "confirm_form" },
      { input: "evet", expectedStep: "completed" },
    ]
  );

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL UPLOAD AND 20 CATEGORIES E2E TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
}

run().catch(async (e) => {
  console.error('❌ E2E Test execution failed:', e);
  process.exit(1);
});
