import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminService } from './admin/admin.service';
import { PrismaService } from './common/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RejectReasonCode, BanReason } from './admin/dto/admin-users.dto';

async function run() {
  console.log('=== STARTING ADMIN MODULE PROGRAMMATIC E2E TEST ===');

  // 1. Bootstrap NestJS Application Context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const adminService = app.get(AdminService);
  const prisma = app.get(PrismaService);

  // 2. Fetch seeded Admin User
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.admin },
  });
  if (!admin) {
    console.error('Seeded Admin not found! Please run seed-admin first.');
    await app.close();
    return;
  }
  console.log(`Admin User Verified: ${admin.name} (ID: ${admin.id})`);

  // 3. Test Dashboard Stats
  console.log('\n--- Step 1: Querying Dashboard Stats ---');
  const stats = await adminService.getDashboardStats();
  console.log('Stats Result:', stats);
  if (stats.pendingProviders >= 2) {
    console.log(`Verified: Found ${stats.pendingProviders} pending providers in queue.`);
  } else {
    console.warn(`Warning: Expected >=2 pending providers, found ${stats.pendingProviders}`);
  }

  // 4. Test Approval Queue
  console.log('\n--- Step 2: Querying Provider Approval Queue ---');
  const queue = await adminService.getApprovalQueue();
  console.log(`Found ${queue.length} pending service providers in queue.`);
  queue.forEach((p) => {
    console.log(`- Provider ID: ${p.id} | User Name: ${p.user.name} | Approved: ${p.is_approved}`);
  });

  if (queue.length < 2) {
    console.error('Expected at least 2 pending providers. Did seeding fail?');
    await app.close();
    return;
  }

  const firstProv = queue[0];
  const secondProv = queue[1];

  // 5. Test Approve Provider
  console.log(`\n--- Step 3: Approving Provider ${firstProv.user.name} (ID: ${firstProv.id}) ---`);
  const approveRes = await adminService.approveProvider(firstProv.id);
  console.log('Approval Response:', approveRes);

  // Verify DB state for approved provider
  const verifiedProv = await prisma.serviceProvider.findUnique({
    where: { id: firstProv.id },
  });
  console.log(`Verified DB State -> is_approved: ${verifiedProv?.is_approved} | approved_at: ${verifiedProv?.approved_at}`);
  if (verifiedProv?.is_approved === true && verifiedProv?.approved_at !== null) {
    console.log('Approve action verified successfully!');
  } else {
    console.error('Approve action failed verification!');
  }

  // 6. Test Reject Provider
  console.log(`\n--- Step 4: Rejecting Provider ${secondProv.user.name} (ID: ${secondProv.id}) ---`);
  const rejectRes = await adminService.rejectProvider(secondProv.id, {
    reasonCode: RejectReasonCode.R01,
    notes: 'Uploaded identity card image is blurry and unreadable.',
  });
  console.log('Rejection Response:', rejectRes);

  // Verify DB state remains unapproved
  const verifiedSecondProv = await prisma.serviceProvider.findUnique({
    where: { id: secondProv.id },
  });
  console.log(`Verified DB State -> is_approved: ${verifiedSecondProv?.is_approved} (Should be false)`);
  if (verifiedSecondProv?.is_approved === false) {
    console.log('Reject action verified successfully! (State kept unapproved)');
  } else {
    console.error('Reject action failed verification!');
  }

  // 7. Test User List & Filter
  console.log('\n--- Step 5: Fetching User List with Filter ---');
  const userResults = await adminService.getUsers({
    role: UserRole.service_provider,
    status: 'active',
    page: 1,
    limit: 5,
  });
  console.log(`Users total: ${userResults.total} | Showing: ${userResults.data.length}`);
  userResults.data.forEach((u) => {
    console.log(`- User ID: ${u.id} | Name: ${u.name} | Decrypted Phone: ${u.phone_decrypted} | Active: ${u.is_active}`);
  });

  // 8. Test User Detail
  console.log('\n--- Step 6: Fetching User Detail ---');
  const testUser = userResults.data[0];
  const detail = await adminService.getUserDetail(testUser.id);
  console.log(`Detail retrieved successfully for: ${detail.name} (Role: ${detail.role})`);
  console.log('Activity Stats:', detail.stats);

  // 9. Test Ban User
  console.log(`\n--- Step 7: Banning User ${secondProv.user.name} (ID: ${secondProv.user_id}) ---`);
  const banRes = await adminService.banUser(secondProv.user_id, {
    reason: BanReason.abuse,
    notes: 'User repeatedly failed document check and insulted audit staff.',
  });
  console.log('Ban Response:', banRes);

  const bannedUser = await prisma.user.findUnique({
    where: { id: secondProv.user_id },
  });
  console.log(`Verified DB State -> is_active: ${bannedUser?.is_active} (Should be false)`);
  if (bannedUser?.is_active === false) {
    console.log('Ban action verified successfully!');
  } else {
    console.error('Ban action failed verification!');
  }

  // 10. Test KVKK Anonymization Force Delete
  // Find Ali Müşteri
  const seeker = await prisma.user.findFirst({
    where: { role: UserRole.service_seeker, name: { contains: 'Ali' } },
  });
  if (seeker) {
    console.log(`\n--- Step 8: Force deleting user ${seeker.name} (ID: ${seeker.id}) for KVKK compliance ---`);
    const kvkkRes = await adminService.kvkkForceDelete(seeker.id);
    console.log('KVKK Response:', kvkkRes);

    // Verify DB state
    const deletedUser = await prisma.user.findUnique({
      where: { id: seeker.id },
    });
    console.log(`Verified DB State:`);
    console.log(`- name: "${deletedUser?.name}" (Should be "Eski Kullanıcı")`);
    console.log(`- email: ${deletedUser?.email} (Should be null)`);
    console.log(`- phone: "${deletedUser?.phone}" (Should be anonymized deleted_...)`);
    console.log(`- phone_masked: "${deletedUser?.phone_masked}"`);
    console.log(`- is_active: ${deletedUser?.is_active} (Should be false)`);
    console.log(`- deleted_at: ${deletedUser?.deleted_at} (Should be set)`);

    if (
      deletedUser?.name === 'Eski Kullanıcı' &&
      deletedUser?.email === null &&
      deletedUser?.phone.startsWith('deleted_') &&
      deletedUser?.is_active === false &&
      deletedUser?.deleted_at !== null
    ) {
      console.log('KVKK force delete verified successfully!');
    } else {
      console.error('KVKK force delete failed verification!');
    }
  } else {
    console.warn('Seeker user "Ali Müşteri" not found! Skipping Step 8.');
  }

  console.log('\n=== ALL ADMIN E2E TEST STEPS COMPLETED ===');
  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Admin E2E Test failed:', err);
  process.exit(1);
});
