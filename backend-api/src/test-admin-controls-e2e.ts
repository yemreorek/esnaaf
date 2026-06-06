import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './admin/admin.service';
import { PrismaService } from './common/prisma/prisma.service';
import { 
  UserRole, 
  StaffRole, 
  JobCompletionStatus, 
  DisputeStatus, 
  CallTaskStatus,
  CallTaskResult as DbCallTaskResult
} from '@prisma/client';
import { 
  RejectReasonCode, 
  BanReason, 
  DisputeDecision, 
  CallTaskResult 
} from './admin/dto/admin-users.dto';
import { encryptPhone, maskPhone } from './common/utils/phone.util';
import { ForbiddenException } from '@nestjs/common';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING ADMIN CONTROLS & PERMISSIONS E2E TEST ===');
  console.log('===========================================================');

  // Bootstrap application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const adminService = app.get(AdminService);
  const prisma = app.get(PrismaService);

  // 1. Clean up all tables to start fresh
  await prisma.auditLog.deleteMany({});
  await prisma.callTask.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.jobCompletion.deleteMany({});
  await prisma.acceptedOffer.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleaned up previous database records.');

  // 2. Seed Super Admin User & Staff
  const superAdminEmail = 'superadmin@esnaaf.com';
  const superAdminPhone = '+905991112233';
  const superAdminUser = await prisma.user.create({
    data: {
      phone: encryptPhone(superAdminPhone),
      phone_masked: maskPhone(superAdminPhone),
      name: 'Kemal Süper Admin',
      email: superAdminEmail,
      role: UserRole.admin,
      kvkk_consent: true,
    },
  });

  const superAdminStaff = await prisma.staff.create({
    data: {
      name: 'Kemal Süper Admin',
      email: superAdminEmail,
      phone: superAdminPhone,
      role: StaffRole.super_admin,
      is_active: true,
    },
  });

  // 3. Seed Quality Staff User & Staff
  const qualityEmail = 'quality@esnaaf.com';
  const qualityPhone = '+905994445566';
  const qualityUser = await prisma.user.create({
    data: {
      phone: encryptPhone(qualityPhone),
      phone_masked: maskPhone(qualityPhone),
      name: 'Melis Kalite',
      email: qualityEmail,
      role: UserRole.admin,
      kvkk_consent: true,
    },
  });

  const qualityStaff = await prisma.staff.create({
    data: {
      name: 'Melis Kalite',
      email: qualityEmail,
      phone: qualityPhone,
      role: StaffRole.quality_staff,
      is_active: true,
    },
  });

  // Seed Seeker
  const seekerPhone = '+905321110011';
  const seeker = await prisma.user.create({
    data: {
      phone: encryptPhone(seekerPhone),
      phone_masked: maskPhone(seekerPhone),
      name: 'Ali Müşteri',
      role: UserRole.service_seeker,
      kvkk_consent: true,
    },
  });

  // Seed Provider
  const providerPhone = '+905322220022';
  const providerUser = await prisma.user.create({
    data: {
      phone: encryptPhone(providerPhone),
      phone_masked: maskPhone(providerPhone),
      name: 'Ahmet Usta',
      role: UserRole.service_provider,
      kvkk_consent: true,
    },
  });

  const provider = await prisma.serviceProvider.create({
    data: {
      user_id: providerUser.id,
      avg_rating: 4.8,
      is_approved: false,
    },
  });

  // Seed Category
  const category = await prisma.category.create({
    data: {
      name: 'Boya Badana',
    },
  });

  console.log('Seeded testing actors successfully.');

  // --- TEST 1: Role-Based Permission Control ---
  console.log('\n--- TEST 1: Role-Based Permission Controls ---');
  // Super admin should be allowed to view staff list
  const staffList = await adminService.getStaffList(superAdminEmail);
  console.log(`✅ Success: Super Admin retrieved staff list successfully (Count: ${staffList.length}).`);

  // Quality staff should be forbidden to view or add staff
  try {
    await adminService.getStaffList(qualityEmail);
    throw new Error('Quality staff was incorrectly allowed to read staff list.');
  } catch (err) {
    if (err instanceof ForbiddenException) {
      console.log('✅ Success: Quality Staff forbidden to read staff list as expected.');
    } else {
      throw err;
    }
  }

  try {
    await adminService.createStaff(qualityEmail, {
      email: 'newstaff@esnaaf.com',
      role: StaffRole.ops_staff,
      name: 'New Ops',
    });
    throw new Error('Quality staff was incorrectly allowed to create a new staff.');
  } catch (err) {
    if (err instanceof ForbiddenException) {
      console.log('✅ Success: Quality Staff forbidden to create a new staff as expected.');
    } else {
      throw err;
    }
  }

  // --- TEST 2: Provider Approval & Rejection with reason code R01-R05 ---
  console.log('\n--- TEST 2: Provider Rejection (R01-R05) & Approval with Audit Logging ---');
  // First test rejection with R01 code
  await adminService.rejectProvider(provider.id, {
    reasonCode: RejectReasonCode.R01,
    notes: 'Identity document is unreadable.',
  }, superAdminEmail);
  
  const rejectedProv = await prisma.serviceProvider.findUnique({ where: { id: provider.id } });
  if (rejectedProv?.is_approved === false) {
    console.log('✅ Success: Provider remains unapproved after reject action.');
  } else {
    throw new Error('Provider was approved despite rejection.');
  }

  // Verify Audit Log for reject action
  let logs = await prisma.auditLog.findMany({
    where: { action: 'provider.reject', target_id: provider.id },
  });
  if (logs.length === 1 && (logs[0].new_value as any)?.reason_code === 'R01') {
    console.log('✅ Success: Reject audit log correctly recorded in database with reason R01.');
  } else {
    throw new Error('Audit log for rejection was not recorded correctly.');
  }

  // Second test approval
  await adminService.approveProvider(provider.id, superAdminEmail);
  const approvedProv = await prisma.serviceProvider.findUnique({ where: { id: provider.id } });
  if (approvedProv?.is_approved === true && approvedProv?.approved_at !== null) {
    console.log('✅ Success: Provider is successfully approved.');
  } else {
    throw new Error('Provider approval failed.');
  }

  // Verify Audit Log for approve action
  logs = await prisma.auditLog.findMany({
    where: { action: 'provider.approve', target_id: provider.id },
  });
  if (logs.length === 1 && (logs[0].new_value as any)?.is_approved === true) {
    console.log('✅ Success: Approve audit log correctly recorded in database.');
  } else {
    throw new Error('Audit log for approval was not recorded correctly.');
  }

  // --- TEST 3: Dispute Resolution Flow ---
  console.log('\n--- TEST 3: Dispute Resolution Flow ---');
  // Seed a disputed JobCompletion record
  const request = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: { details: 'Boya Badana', district: 'Şişli' },
      status: 'completed',
    },
  });

  const offer = await prisma.offer.create({
    data: {
      job_id: request.id,
      provider_id: provider.id,
      price: 1500,
      status: 'accepted',
    },
  });

  const completion = await prisma.jobCompletion.create({
    data: {
      job_id: request.id,
      offer_id: offer.id,
      provider_id: provider.id,
      seeker_id: seeker.id,
      provider_declared_amount: 1500,
      seeker_declared_amount: 1000,
      amount_diff: 500,
      amount_diff_pct: 50,
      alarm_level: 'red',
      dispute_status: DisputeStatus.open,
      status: JobCompletionStatus.disputed,
    },
  });

  // Resolve the dispute as super admin
  await adminService.resolveDispute(superAdminEmail, completion.id, {
    decision: DisputeDecision.seeker_correct,
    resolutionNote: 'Seeker provided invoice proof showing 1000 TL.',
  });

  const resolvedComp = await prisma.jobCompletion.findUnique({ where: { id: completion.id } });
  if (resolvedComp?.dispute_status === DisputeStatus.resolved && resolvedComp?.status === JobCompletionStatus.completed) {
    console.log('✅ Success: Dispute resolved successfully and marked as completed.');
    console.log(`Resolution Note: "${resolvedComp.resolution_note}"`);
  } else {
    throw new Error('Dispute resolution failed.');
  }

  // Verify Audit Log
  const disputeLogs = await prisma.auditLog.findMany({
    where: { action: 'dispute.resolve', target_id: completion.id },
  });
  if (disputeLogs.length === 1 && (disputeLogs[0].new_value as any)?.dispute_status === 'resolved') {
    console.log('✅ Success: Dispute resolution audit log recorded in database.');
  } else {
    throw new Error('Dispute resolution audit log was not recorded correctly.');
  }

  // --- TEST 4: FIFO Call Task Queue & Rescheduling ---
  console.log('\n--- TEST 4: FIFO Call Task Queue & Rescheduling Flow ---');
  // Seed call tasks with different created dates (FIFO test)
  const dateA = new Date();
  dateA.setHours(dateA.getHours() - 3);

  const dateB = new Date();
  dateB.setHours(dateB.getHours() - 2);

  const dateC = new Date();
  dateC.setHours(dateC.getHours() - 1);

  const taskA = await prisma.callTask.create({
    data: {
      job_completion_id: completion.id,
      customer_id: seeker.id,
      priority: 'normal',
      status: CallTaskStatus.pending,
      created_at: dateA,
      due_at: new Date(),
    },
  });

  const taskB = await prisma.callTask.create({
    data: {
      job_completion_id: completion.id,
      customer_id: seeker.id,
      priority: 'normal',
      status: CallTaskStatus.pending,
      created_at: dateB,
      due_at: new Date(),
    },
  });

  const taskC = await prisma.callTask.create({
    data: {
      job_completion_id: completion.id,
      customer_id: seeker.id,
      priority: 'normal',
      status: CallTaskStatus.pending,
      created_at: dateC,
      due_at: new Date(),
    },
  });

  // Fetch FIFO list and assert order A -> B -> C
  const fifoQueue = await adminService.getCallTasksFifo(qualityEmail);
  console.log(`FIFO Call tasks fetched (Count: ${fifoQueue.length}).`);
  
  if (fifoQueue[0].id === taskA.id && fifoQueue[1].id === taskB.id && fifoQueue[2].id === taskC.id) {
    console.log('✅ Success: Arama görevleri en eski tarihten en yeniye (FIFO) doğru sıralanmıştır.');
  } else {
    throw new Error('FIFO sorting failed.');
  }

  // Process attempt 1 as unreachable
  console.log('Attempt 1: Marking Task A as unreachable...');
  await adminService.submitCallTaskResult(qualityEmail, taskA.id, {
    result: CallTaskResult.unreachable,
    notes: 'Phone switched off.',
  });

  let updatedTaskA = await prisma.callTask.findUnique({ where: { id: taskA.id } });
  if (updatedTaskA?.attempt_count === 1 && updatedTaskA?.status === CallTaskStatus.pending) {
    console.log('✅ Success: First unreachable attempt recorded, status kept pending for reschedule.');
  } else {
    throw new Error('First unreachable attempt failed processing.');
  }

  // Process attempt 2 as unreachable
  console.log('Attempt 2: Marking Task A as unreachable...');
  await adminService.submitCallTaskResult(qualityEmail, taskA.id, {
    result: CallTaskResult.unreachable,
  });

  // Process attempt 3 as unreachable (this should close the task)
  console.log('Attempt 3: Marking Task A as unreachable (threshold 3)...');
  await adminService.submitCallTaskResult(qualityEmail, taskA.id, {
    result: CallTaskResult.unreachable,
    notes: 'Tried 3 times. Closing task.',
  });

  updatedTaskA = await prisma.callTask.findUnique({ where: { id: taskA.id } });
  if (updatedTaskA?.attempt_count === 3 && updatedTaskA?.status === CallTaskStatus.done && updatedTaskA?.completed_at !== null) {
    console.log('✅ Success: Unreachable threshold reached (3 attempts), task closed as DONE.');
  } else {
    throw new Error('Unreachable threshold failed processing.');
  }

  // --- TEST 5: Staff Onboarding & Automated User Creation ---
  console.log('\n--- TEST 5: Staff Onboarding & Automated User Creation ---');
  const hrEmail = 'hr@esnaaf.com';
  const hrPhone = '+905999998888';
  await adminService.createStaff(superAdminEmail, {
    email: hrEmail,
    role: StaffRole.hr_staff,
    name: 'Ayşe İK',
    phone: hrPhone,
  });

  // Verify Staff is created
  const newStaff = await prisma.staff.findUnique({ where: { email: hrEmail } });
  if (newStaff && newStaff.role === StaffRole.hr_staff) {
    console.log('✅ Success: New İK staff record created in Staff table.');
  } else {
    throw new Error('Staff record creation failed.');
  }

  // Verify matching User is created with role 'admin'
  const matchingUser = await prisma.user.findFirst({ where: { email: hrEmail } });
  if (matchingUser && matchingUser.role === UserRole.admin) {
    console.log(`✅ Success: Matching User record automatically generated in Users table with role 'admin'.`);
    console.log(`Matching User phone (masked): "${matchingUser.phone_masked}"`);
  } else {
    throw new Error('Matching User record creation failed.');
  }

  // --- TEST 6: Get Admin Profile & Permissions ---
  console.log('\n--- TEST 6: Get Admin Profile & Permissions ---');
  // 1. Kemal Super Admin Profile
  const superAdminProfile = await adminService.getAdminProfile(superAdminEmail);
  if (superAdminProfile && superAdminProfile.role === StaffRole.super_admin && superAdminProfile.permissions.dashboard === 'full') {
    console.log('✅ Success: Super Admin profile and full permissions verified.');
  } else {
    throw new Error('Super Admin profile verification failed.');
  }

  // 2. Ayşe HR Profile
  const hrProfile = await adminService.getAdminProfile(hrEmail);
  if (hrProfile && hrProfile.role === StaffRole.hr_staff && hrProfile.permissions.staff === 'full' && hrProfile.permissions.payments === 'none') {
    console.log('✅ Success: HR Staff profile and restricted permissions verified.');
  } else {
    throw new Error('HR Staff profile verification failed.');
  }

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL ADMIN CONTROLS E2E TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Admin E2E Test Failed with error:', err);
  process.exit(1);
});
