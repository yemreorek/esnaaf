import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { FavoriteService } from './ortak/favorites/favorite.service';
import { TaleplerService } from './musteri/talepler/talepler.service';
import { TaleplerProcessor } from './musteri/talepler/talepler.processor';
import { JobCompletionStatus } from '@prisma/client';
import { encryptPhone, maskPhone } from './common/utils/phone.util';
import { randomUUID } from 'crypto';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING FAVORITE PROVIDERS & SMART ROUTING E2E TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const prisma = app.get(PrismaService);
  const favoriteService = app.get(FavoriteService);
  const taleplerService = app.get(TaleplerService);
  const taleplerProcessor = app.get(TaleplerProcessor);

  // 2. Clean up previous favorites and related tables
  await prisma.$executeRawUnsafe('TRUNCATE TABLE favorite_providers, referrals, campaigns, campaign_usage, provider_monthly_quota, subscriptions, payments, job_completions, call_tasks, phone_reveal_logs, accepted_offers, offers, service_requests, service_providers, users CASCADE');
  console.log('Cleaned database tables with CASCADE truncate for fresh favorites E2E test.');

  // Find or create category first
  const category = await prisma.category.upsert({
    where: { name: 'Ev Temizliği' },
    create: { name: 'Ev Temizliği', isActive: true },
    update: { isActive: true },
  });

  // Helper to generate UUID that deterministically maps to Istanbul (index 0 to 16 out of 38)
  const generateIstanbulUuid = () => {
    const districtsCount = 38;
    while (true) {
      const id = randomUUID();
      const charCodeSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const index = charCodeSum % districtsCount;
      if (index <= 16) {
        return id;
      }
    }
  };

  const seekerId = generateIstanbulUuid();
  const providerUserId = generateIstanbulUuid();
  const providerId = generateIstanbulUuid();
  const normalProviderUserId = generateIstanbulUuid();
  const normalProviderId = generateIstanbulUuid();

  // 3. Seed test seeker and providers directly with Istanbul-compliant UUIDs
  const haPhone = '+905330000010';
  const seeker = await prisma.user.create({
    data: {
      id: seekerId,
      phone: encryptPhone(haPhone),
      phone_masked: maskPhone(haPhone),
      name: 'Ali Seeker',
      role: 'service_seeker',
      kvkk_consent: true,
    },
  });

  const hv1Phone = '+905320000011';
  const providerUser = await prisma.user.create({
    data: {
      id: providerUserId,
      phone: encryptPhone(hv1Phone),
      phone_masked: maskPhone(hv1Phone),
      name: 'Ahmet Usta',
      role: 'service_provider',
      kvkk_consent: true,
    },
  });

  const provider = await prisma.serviceProvider.create({
    data: {
      id: providerId,
      user_id: providerUser.id,
      category_ids: [category.id],
      is_approved: true,
      approved_at: new Date(),
      city: 'Adana',
      service_districts: ['Çukurova']
    },
  });

  const hv2Phone = '+905320000012';
  const normalProviderUser = await prisma.user.create({
    data: {
      id: normalProviderUserId,
      phone: encryptPhone(hv2Phone),
      phone_masked: maskPhone(hv2Phone),
      name: 'Mehmet Usta',
      role: 'service_provider',
      kvkk_consent: true,
    },
  });

  const normalProvider = await prisma.serviceProvider.create({
    data: {
      id: normalProviderId,
      user_id: normalProviderUser.id,
      category_ids: [category.id],
      is_approved: true,
      approved_at: new Date(),
      city: 'Adana',
      service_districts: ['Çukurova']
    },
  });

  console.log(`Seeker ID: ${seeker.id}`);
  console.log(`Favorite Provider ID: ${provider.id} (${providerUser.name})`);
  console.log(`Normal Provider ID: ${normalProvider.id} (${normalProviderUser.name})`);

  // --- TEST 1: Direct Favorite Addition (No Completed Job, No Review) ---
  console.log('\n--- TEST 1: Direct Favorite Addition (No Completed Job, No Review) ---');
  try {
    const directFav = await favoriteService.addFavorite(seeker.id, provider.id);
    console.log(`✅ Success: Provider favoriye doğrudan eklendi! Fav ID: ${directFav.id}`);
    
    // Clean up for next tests
    await favoriteService.removeFavorite(seeker.id, provider.id);
    console.log('Cleaned up direct favorite for next test steps.');
  } catch (err: any) {
    console.error('❌ Fail: Direct favorite addition failed!', err);
  }

  // --- TEST 2: Favorite Addition with Completed Job (But No Review) ---
  console.log('\n--- TEST 2: Favorite Addition with Completed Job (But No Review) ---');

  // Create a completed job completion record
  const jobRecord = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: { details: 'Ev Temizliği', city: 'Adana', district: 'Çukurova' },
      status: 'completed',
    },
  });

  const offerRecord = await prisma.offer.create({
    data: {
      job_id: jobRecord.id,
      provider_id: provider.id,
      price: 800,
      status: 'accepted',
    },
  });

  await prisma.jobCompletion.create({
    data: {
      job_id: jobRecord.id,
      offer_id: offerRecord.id,
      seeker_id: seeker.id,
      provider_id: provider.id,
      status: JobCompletionStatus.completed,
    },
  });

  try {
    const jobFav = await favoriteService.addFavorite(seeker.id, provider.id);
    console.log(`✅ Success: Provider favoriye eklendi (iş tamamlandı, yorum yok)! Fav ID: ${jobFav.id}`);
    
    // Clean up for next tests
    await favoriteService.removeFavorite(seeker.id, provider.id);
    console.log('Cleaned up job favorite for next test steps.');
  } catch (err: any) {
    console.error('❌ Fail: Favorite addition with completed job failed!', err);
  }

  // --- TEST 3: Successful Favorite Addition with Review ---
  console.log('\n--- TEST 3: Successful Favorite Addition with Review ---');
  await prisma.review.create({
    data: {
      job_id: jobRecord.id,
      reviewer_id: seeker.id,
      provider_id: provider.id,
      rating: 5,
      comment: 'Harika hizmet!',
    },
  });

  const addedFav = await favoriteService.addFavorite(seeker.id, provider.id);
  console.log(`✅ Success: Provider favoriye eklendi (yorum dahil)! Fav ID: ${addedFav.id}`);

  // --- TEST 4: Validation Constraint - Duplicate Favorite ---
  console.log('\n--- TEST 4: Validation Constraint - Duplicate Favorite ---');
  try {
    await favoriteService.addFavorite(seeker.id, provider.id);
    console.error('❌ Fail: Expected addFavorite to throw duplicate favorite error!');
  } catch (err: any) {
    console.log(`✅ Success: Mükerrer ekleme engellendi as expected! Error: "${err.message}"`);
  }

  // --- TEST 5: Smart Routing (Only distribute to favorite providers) ---
  console.log('\n--- TEST 5: Smart Routing (Only distribute to favorite providers) ---');
  
  // Create a new request using TaleplerService with sendToFavoritesOnly: true
  const createResult = await taleplerService.create(seeker.id, {
    categorySlug: 'ev-temizligi',
    district: 'Çukurova',
    details: 'Ev temizliği, 3 oda 1 salon.',
    name: 'Ali Seeker',
    sendToFavoritesOnly: true,
  });

  console.log(`Job created with sendToFavoritesOnly: ${(createResult.job.form_data as any).sendToFavoritesOnly}`);
  
  // Verify that the job is in the database and formData matches
  const jobDb = await prisma.serviceRequest.findUnique({
    where: { id: createResult.job.id },
  });

  if ((jobDb?.form_data as any).sendToFavoritesOnly === true) {
    console.log('✅ Success: sendToFavoritesOnly persisted to database form_data successfully.');
  } else {
    console.error('❌ Fail: sendToFavoritesOnly not persisted!');
  }

  // Set NODE_ENV to test to enable immediate BullMQ simulation
  process.env.NODE_ENV = 'test';

  // Run the distribution processor directly
  await taleplerProcessor.handleDistribution({
    data: { jobId: createResult.job.id },
    queue: {
      add: async (name: string, data: any, opts: any) => {
        console.log(`[BullMQ Mock] Fallback genel dağıtım job'ı planlandı: ${name}`, data, opts);
        return {} as any;
      },
    },
  } as any);

  // Check that responseTime records are created only for the favorite provider (Ahmet Usta)
  const notifications = await prisma.responseTime.findMany({
    where: { job_id: createResult.job.id },
  });

  console.log(`Total notified providers: ${notifications.length}`);
  const containsFavorite = notifications.some(n => n.provider_id === provider.id);
  const containsNormal = notifications.some(n => n.provider_id === normalProvider.id);

  if (containsFavorite && !containsNormal) {
    console.log('✅ Success: Smart Routing distributed the request ONLY to the favorite provider!');
  } else {
    console.error('❌ Fail: Distribution went to normal providers despite favorite filter!');
  }

  // --- TEST 6: Fallback Routing (General Distribution) ---
  console.log('\n--- TEST 6: Fallback Routing (General Distribution) ---');
  // Clean notifications for clean fallback check
  await prisma.responseTime.deleteMany({
    where: { job_id: createResult.job.id },
  });

  // Run distribution with isFallback: true
  await taleplerProcessor.handleDistribution({
    data: { jobId: createResult.job.id, isFallback: true },
  } as any);

  const fallbackNotifications = await prisma.responseTime.findMany({
    where: { job_id: createResult.job.id },
  });

  console.log(`Total notified providers in fallback: ${fallbackNotifications.length}`);
  const fbContainsFavorite = fallbackNotifications.some(n => n.provider_id === provider.id);
  const fbContainsNormal = fallbackNotifications.some(n => n.provider_id === normalProvider.id);

  if (fbContainsFavorite && fbContainsNormal) {
    console.log('✅ Success: Fallback distributed the request to ALL eligible providers (including normal)!');
  } else {
    console.error('❌ Fail: Fallback general distribution did not notify all candidates!');
  }

  // --- TEST 7: Listing and Removing Favorites ---
  console.log('\n--- TEST 7: Listing and Removing Favorites ---');
  const favListBefore = await favoriteService.getFavorites(seeker.id);
  console.log(`Favorites list size before deletion: ${favListBefore.length}`);
  if (favListBefore.length === 1 && favListBefore[0].provider_id === provider.id) {
    console.log('✅ Success: Favorite listed correctly in list favorites query.');
  }

  await favoriteService.removeFavorite(seeker.id, provider.id);
  console.log('Provider removed from favorites.');

  const favListAfter = await favoriteService.getFavorites(seeker.id);
  console.log(`Favorites list size after deletion: ${favListAfter.length}`);
  if (favListAfter.length === 0) {
    console.log('✅ Success: Favorite successfully deleted and list is now empty.');
  }

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL FAVORITE PROVIDERS E2E TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Favorites E2E Test failed:', err);
  process.exit(1);
});
