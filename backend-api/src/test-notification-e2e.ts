import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BildirimService } from './ortak/bildirimler/bildirim.service';
import { PrismaService } from './common/prisma/prisma.service';
import { BILDIRIM_SABLONLARI } from './ortak/bildirimler/bildirim-sablonlari';
import { NotifStatus, NpsGroup } from '@prisma/client';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING NPS & NOTIFICATION E2E INTEGRATION TEST ===');
  console.log('===========================================================');

  // Bootstrap application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const bildirimService = app.get(BildirimService);
  const prisma = app.get(PrismaService);

  // Retrieve injected BullMQ queues from application to inspect them
  // We can get them from NestJS container by token or using the registered module exports
  const npsQueue = app.get<Queue>('BullQueue_nps-survey');
  const disputeQueue = app.get<Queue>('BullQueue_dispute-alert');

  // 1. Clean up previous notification/NPS tables to start fresh
  await prisma.npsResponse.deleteMany({});
  await prisma.notificationLog.deleteMany({});
  await prisma.callTask.deleteMany({});
  await prisma.jobCompletion.deleteMany({});
  await prisma.phoneRevealLog.deleteMany({});
  await prisma.acceptedOffer.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  console.log('Cleaned up previous database records.');

  // 2. Fetch seeded seeker and provider or seed them
  let seeker = await prisma.user.findFirst({ where: { role: 'service_seeker' } });
  if (!seeker) {
    seeker = await prisma.user.create({
      data: {
        phone: '+905551112233',
        phone_masked: '0555 *** 22 33',
        name: 'Ali Müşteri',
        role: 'service_seeker',
        kvkk_consent: true,
      },
    });
  }

  let providerUser = await prisma.user.findFirst({ where: { role: 'service_provider' } });
  if (!providerUser) {
    providerUser = await prisma.user.create({
      data: {
        phone: '+905554445566',
        phone_masked: '0555 *** 55 66',
        name: 'Ahmet Usta',
        role: 'service_provider',
        kvkk_consent: true,
      },
    });
  }

  let provider = await prisma.serviceProvider.findUnique({
    where: { user_id: providerUser.id },
  });
  if (!provider) {
    provider = await prisma.serviceProvider.create({
      data: {
        user_id: providerUser.id,
        avg_rating: 4.8,
        is_approved: true,
        approved_at: new Date(),
      },
    });
  }

  // Seed Admin Staff if they don't exist
  let leader = await prisma.staff.findFirst({ where: { role: 'team_leader' } });
  if (!leader) {
    leader = await prisma.staff.create({
      data: {
        email: 'teamleader@esnaaf.com',
        name: 'Bülent Lider',
        role: 'team_leader',
        is_active: true,
      },
    });
  }

  let quality = await prisma.staff.findFirst({ where: { role: 'quality_staff' } });
  if (!quality) {
    quality = await prisma.staff.create({
      data: {
        email: 'quality@esnaaf.com',
        name: 'Melis Kalite',
        role: 'quality_staff',
        is_active: true,
      },
    });
  }

  console.log(`Seeker: ${seeker.name} (ID: ${seeker.id})`);
  console.log(`Provider: ${providerUser.name} (ID: ${provider.id})`);
  console.log(`Team Leader: ${leader.name} | Quality Staff: ${quality.name}`);

  // Fetch a Category
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Ev Temizliği',
      },
    });
  }

  // 3. Test FCM Token Registration
  console.log('\n--- TEST 1: FCM Token Registration ---');
  const token = 'mock-fcm-push-token-xyz-12345';
  await bildirimService.saveFcmToken(seeker.id, token);
  const updatedSeeker = await prisma.user.findUnique({ where: { id: seeker.id } });
  if (updatedSeeker?.fcm_token === token) {
    console.log('✅ Success: FCM Token saved successfully to Seeker User.');
  } else {
    throw new Error('FCM token was not saved correctly.');
  }

  // 4. Test All Notification Templates
  console.log('\n--- TEST 2: Formatting & Sending All Notification Templates ---');
  const templateKeys = Object.keys(BILDIRIM_SABLONLARI);
  console.log(`Verifying all ${templateKeys.length} templates...`);

  let count = 0;
  for (const eventCode of templateKeys) {
    // Send to seeker or provider depending on code prefix
    const targetUserId = eventCode.startsWith('HV-') ? providerUser.id : seeker.id;
    await bildirimService.sendNotification(targetUserId, eventCode, {
      hv_name: 'Ahmet Usta',
      ha_name: 'Ali Müşteri',
      count: 5,
      status: 'Çözüldü',
      reason: 'Eksik Belge',
      discount: '%15 İndirim',
      provider_name: 'Ahmet Usta',
      provider_id: provider.id,
    });
    count++;
  }
  console.log(`✅ Success: All ${count} notification codes successfully formatted and sent without exception.`);

  // Verify notification log count in DB
  const logsCount = await prisma.notificationLog.count();
  console.log(`Database verification: Recorded ${logsCount} successful log lines in PGSQL.`);

  // Clear log table to isolate NPS tests
  await prisma.notificationLog.deleteMany({});

  // Clean Queues before tests
  await npsQueue.empty();
  await disputeQueue.empty();

  // Helper function to create a JobCompletion record
  const createMockCompletion = async (index: number) => {
    const request = await prisma.serviceRequest.create({
      data: {
        seeker_id: seeker.id,
        category_id: category.id,
        form_data: { details: `Mock Job ${index}`, district: 'Kadıköy' },
        status: 'completed',
      },
    });

    const offer = await prisma.offer.create({
      data: {
        job_id: request.id,
        provider_id: provider.id,
        price: 1000,
        status: 'accepted',
      },
    });

    return prisma.jobCompletion.create({
      data: {
        job_id: request.id,
        offer_id: offer.id,
        provider_id: provider.id,
        seeker_id: seeker.id,
        provider_declared_amount: 1000,
        provider_confirmed: true,
        seeker_declared_amount: 1000,
        seeker_confirmed: true,
        status: 'completed',
      },
    });
  };

  // 5. Test NPS Detractor Flow (Score 0-3)
  console.log('\n--- TEST 3: NPS Detractor Flow (Score 0-3) ---');
  const comp1 = await createMockCompletion(1);
  console.log(`Created Mock JobCompletion: ${comp1.id}`);

  // Seeker scores 2 (Detractor)
  await bildirimService.recordNpsResponse(seeker.id, {
    jobCompletionId: comp1.id,
    score: 2,
    followUpText: 'Hizmet çok kalitesizdi ve usta geç geldi.',
  });

  const response1 = await prisma.npsResponse.findFirst({
    where: { job_completion_id: comp1.id },
  });

  if (response1 && response1.group === NpsGroup.detractor) {
    console.log('✅ Success: NPS Response recorded in database under DETRACTOR group.');
  } else {
    throw new Error('NPS response was not correctly grouped under DETRACTOR.');
  }

  // Inspect BullMQ queues
  const npsDelayed = await npsQueue.getJobs(['delayed']);
  const disputeJobs = await disputeQueue.getJobs(['waiting', 'delayed', 'active']);
  const disputeCompleted = await disputeQueue.getJobs(['completed']);

  // We expect:
  // - 1 delayed follow-up trigger in nps-survey queue (HA-09)
  // - 1 immediate detractor-alert job in dispute-alert queue
  console.log(`BullMQ 'nps-survey' delayed jobs: ${npsDelayed.length}`);
  console.log(`BullMQ 'dispute-alert' active/waiting jobs: ${disputeJobs.length} | Completed: ${disputeCompleted.length}`);

  if (npsDelayed.length >= 1 && (disputeJobs.length >= 1 || disputeCompleted.length >= 1)) {
    console.log('✅ Success: BullMQ queues successfully populated with delayed follow-up and immediate quality alerts.');
  } else {
    throw new Error('BullMQ queues were not properly populated.');
  }

  // 6. Test AD-07 Detractor Threshold Alarm (3 detractors in 30 days)
  console.log('\n--- TEST 4: Detractor Threshold Alarm (3+ Detractors) ---');
  const comp2 = await createMockCompletion(2);
  const comp3 = await createMockCompletion(3);

  console.log('Recording 2nd detractor score (3/10)...');
  await bildirimService.recordNpsResponse(seeker.id, {
    jobCompletionId: comp2.id,
    score: 3,
  });

  console.log('Recording 3rd detractor score (1/10) - This should trigger AD-07!');
  await bildirimService.recordNpsResponse(seeker.id, {
    jobCompletionId: comp3.id,
    score: 1,
  });

  const ad07Logs = await prisma.notificationLog.findMany({
    where: { event_code: 'AD-07' },
  });

  console.log(`Detractor trigger log count (AD-07): ${ad07Logs.length}`);
  if (ad07Logs.length > 0) {
    console.log('✅ Success: Detractor threshold reached. [AD-07] Acil Detraktör Alarmı logged successfully for team leaders.');
    console.log(`Alarm details: "${(ad07Logs[0].payload as any)?.body}"`);
  } else {
    throw new Error('AD-07 alert was not triggered.');
  }

  // 7. Test NPS Promoter Flow (Score 7-10)
  console.log('\n--- TEST 5: NPS Promoter Flow (Score 7-10) ---');
  const comp4 = await createMockCompletion(4);

  // Clear queues for promoter test
  await npsQueue.empty();

  // Seeker scores 9 (Promoter)
  await bildirimService.recordNpsResponse(seeker.id, {
    jobCompletionId: comp4.id,
    score: 9,
    followUpText: 'Harika bir deneyim, çok memnun kaldım!',
  });

  const response4 = await prisma.npsResponse.findFirst({
    where: { job_completion_id: comp4.id },
  });

  if (response4 && response4.group === NpsGroup.promoter) {
    console.log('✅ Success: NPS Response recorded in database under PROMOTER group.');
  } else {
    throw new Error('NPS response was not correctly grouped under PROMOTER.');
  }

  const npsPromoterDelayed = await npsQueue.getJobs(['delayed']);
  console.log(`BullMQ 'nps-survey' delayed jobs (Expected HA-10 Review invite): ${npsPromoterDelayed.length}`);
  if (npsPromoterDelayed.length >= 1) {
    console.log('✅ Success: BullMQ successfully scheduled 2h-delayed review invitation (HA-10) for promoter seeker.');
  } else {
    throw new Error('HA-10 review invitation was not correctly scheduled.');
  }

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL NPS & NOTIFICATION E2E TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ E2E Test Failed with error:', err);
  process.exit(1);
});
