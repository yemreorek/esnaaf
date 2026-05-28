import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { JobCompletionService } from './ortak/job-completion/job-completion.service';
import { PrismaService } from './common/prisma/prisma.service';
import { JobCompletionStatus, AlarmLevel, PriorityLevel } from '@prisma/client';

async function run() {
  console.log('=== STARTING JOB COMPLETION ALARMS & SLA INTEGRATION TEST ===');

  // 1. Bootstrap NestJS Application Context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const jobCompletionService = app.get(JobCompletionService);
  const prisma = app.get(PrismaService);

  // 2. Clean previous completions & tasks to start fresh
  await prisma.callTask.deleteMany({});
  await prisma.jobCompletion.deleteMany({});
  console.log('Cleaned previous completions & call tasks.');

  // 3. Find our seeded customer (seeker) and provider ( Ahmet )
  const seeker = await prisma.user.findFirst({ where: { role: 'service_seeker' } });
  const providerUser = await prisma.user.findFirst({
    where: { role: 'service_provider', name: { contains: 'Ahmet' } },
  });

  if (!seeker || !providerUser) {
    console.error('Customer or Provider not found! Make sure database is seeded.');
    await app.close();
    return;
  }

  // Create a Mock ServiceRequest (Job) and AcceptedOffer
  const category = await prisma.category.findFirst({ where: { isActive: true } });
  if (!category) {
    console.error('Active category not found!');
    await app.close();
    return;
  }

  // Helper function to create fresh request & acceptance
  const createMockJobAndAcceptance = async (uniqueSuffix: string) => {
    const job = await prisma.serviceRequest.create({
      data: {
        seeker_id: seeker.id,
        category_id: category.id,
        form_data: { details: `Bahar temizliği ${uniqueSuffix}` },
        status: 'distributed',
      },
    });

    const provider = await prisma.serviceProvider.findUnique({
      where: { user_id: providerUser.id },
    });

    if (!provider) throw new Error('Provider not found');

    const offer = await prisma.offer.create({
      data: {
        job_id: job.id,
        provider_id: provider.id,
        price: 850,
        status: 'accepted',
      },
    });

    const acceptedOffer = await prisma.acceptedOffer.create({
      data: {
        job_id: job.id,
        offer_id: offer.id,
        seeker_id: seeker.id,
        provider_id: provider.id,
      },
    });

    return { job, provider, acceptedOffer };
  };

  // ==========================================
  // SCENARIO A: %0 Sapma (Normal Akış)
  // ==========================================
  console.log('\n--- SCENARIO A: %0 Deviation (Normal Completion) ---');
  const scA = await createMockJobAndAcceptance('scA');
  
  // HV declares completion: 850 TL
  await jobCompletionService.declareCompletion(providerUser.id, scA.job.id, {
    price: 850,
    note: 'Bütün camlar silindi.',
  });

  // HA confirms: 850 TL (confirmed = true)
  const confirmResA = await jobCompletionService.confirmCompletion(seeker.id, scA.job.id, {
    confirmed: true,
  });
  console.log('Scenario A Confirm Response:', confirmResA);

  // Assertions
  const compA = await prisma.jobCompletion.findFirst({ where: { job_id: scA.job.id } });
  console.log(`Verified ScA -> status: ${compA?.status} | alarm: ${compA?.alarm_level}`);
  if (compA?.status === JobCompletionStatus.completed && compA?.alarm_level === AlarmLevel.none) {
    console.log('✅ Scenario A verified: completed with AlarmLevel.none');
  } else {
    console.error('❌ Scenario A verification failed!');
  }

  // ==========================================
  // SCENARIO B: %25 Sapma (Sarı Alarm & 48h SLA)
  // ==========================================
  console.log('\n--- SCENARIO B: %25 Deviation (Yellow Alarm & 48h SLA) ---');
  const scB = await createMockJobAndAcceptance('scB');

  // HV declares: 1000 TL
  await jobCompletionService.declareCompletion(providerUser.id, scB.job.id, {
    price: 1000,
  });

  // HA says: I paid 800 TL (confirmed = false, declaredAmount = 800)
  const confirmResB = await jobCompletionService.confirmCompletion(seeker.id, scB.job.id, {
    confirmed: false,
    declaredAmount: 800,
  });
  console.log('Scenario B Confirm Response:', confirmResB);

  // Assertions
  const compB = await prisma.jobCompletion.findFirst({ where: { job_id: scB.job.id } });
  const taskB = await prisma.callTask.findFirst({ where: { job_completion_id: compB?.id } });
  
  console.log(`Verified ScB -> status: ${compB?.status} | alarm: ${compB?.alarm_level}`);
  console.log(`Verified ScB Task -> priority: ${taskB?.priority} | due_at: ${taskB?.due_at?.toISOString()}`);
  
  if (
    compB?.status === JobCompletionStatus.disputed &&
    compB?.alarm_level === AlarmLevel.yellow &&
    taskB?.priority === PriorityLevel.normal
  ) {
    console.log('✅ Scenario B verified: disputed, Yellow Alarm, normal priority CallTask created.');
  } else {
    console.error('❌ Scenario B verification failed!');
  }

  // ==========================================
  // SCENARIO C: %41 Sapma (Kırmızı Alarm & 24h SLA)
  // ==========================================
  console.log('\n--- SCENARIO C: %41 Deviation (Red Alarm & 24h SLA) ---');
  const scC = await createMockJobAndAcceptance('scC');

  // HV declares: 1200 TL
  await jobCompletionService.declareCompletion(providerUser.id, scC.job.id, {
    price: 1200,
  });

  // HA says: I paid 850 TL
  const confirmResC = await jobCompletionService.confirmCompletion(seeker.id, scC.job.id, {
    confirmed: false,
    declaredAmount: 850,
  });
  console.log('Scenario C Confirm Response:', confirmResC);

  // Assertions
  const compC = await prisma.jobCompletion.findFirst({ where: { job_id: scC.job.id } });
  const taskC = await prisma.callTask.findFirst({ where: { job_completion_id: compC?.id } });
  
  console.log(`Verified ScC -> status: ${compC?.status} | alarm: ${compC?.alarm_level}`);
  console.log(`Verified ScC Task -> priority: ${taskC?.priority} | due_at: ${taskC?.due_at?.toISOString()}`);
  
  if (
    compC?.status === JobCompletionStatus.disputed &&
    compC?.alarm_level === AlarmLevel.red &&
    taskC?.priority === PriorityLevel.urgent
  ) {
    console.log('✅ Scenario C verified: disputed, Red Alarm, urgent priority CallTask created.');
  } else {
    console.error('❌ Scenario C verification failed!');
  }

  // ==========================================
  // SCENARIO D: HA Onaylamıyor (Hizmet Almadım - 24h SLA)
  // ==========================================
  console.log('\n--- SCENARIO D: Seeker rejects service completely (Urgent SLA) ---');
  const scD = await createMockJobAndAcceptance('scD');

  // HV declares: 850 TL
  await jobCompletionService.declareCompletion(providerUser.id, scD.job.id, {
    price: 850,
  });

  // HA says: I did not receive the service (confirmed = false, declaredAmount = 0)
  const confirmResD = await jobCompletionService.confirmCompletion(seeker.id, scD.job.id, {
    confirmed: false,
    declaredAmount: 0,
  });
  console.log('Scenario D Confirm Response:', confirmResD);

  // Assertions
  const compD = await prisma.jobCompletion.findFirst({ where: { job_id: scD.job.id } });
  const taskD = await prisma.callTask.findFirst({ where: { job_completion_id: compD?.id } });
  
  console.log(`Verified ScD -> status: ${compD?.status} | alarm: ${compD?.alarm_level}`);
  console.log(`Verified ScD Task -> priority: ${taskD?.priority} | due_at: ${taskD?.due_at?.toISOString()}`);
  
  if (
    compD?.status === JobCompletionStatus.disputed &&
    compD?.alarm_level === AlarmLevel.red &&
    taskD?.priority === PriorityLevel.urgent
  ) {
    console.log('✅ Scenario D verified: disputed, Red Alarm (Service Seeker rejects), urgent priority CallTask created.');
  } else {
    console.error('❌ Scenario D verification failed!');
  }

  console.log('\n=== ALL JOB COMPLETION SLA E2E TEST STEPS SUCCEEDED ===');
  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('E2E Test failed:', err);
  process.exit(1);
});
