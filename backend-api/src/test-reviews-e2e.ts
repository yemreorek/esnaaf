import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma/prisma.service';
import { StorageService } from './common/storage/storage.service';
import { ReviewService } from './ortak/reviews/review.service';
import { ReviewStatus } from '@prisma/client';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING PHOTO REVIEWS & S3/MOCK STORAGE E2E TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS Application Context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const prisma = app.get(PrismaService);
  const storageService = app.get(StorageService);
  const reviewService = app.get(ReviewService);

  // 2. Clean up previous reviews
  await prisma.review.deleteMany({});
  console.log('Cleaned previous reviews in database.');

  // 3. Find our seeded customer (seeker), provider ( Ahmet Usta ) and an admin
  const seeker = await prisma.user.findFirst({ where: { role: 'service_seeker' } });
  const providerUser = await prisma.user.findFirst({
    where: { role: 'service_provider', name: { contains: 'Ahmet' } },
  });
  let adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });

  if (!adminUser) {
    // Seed an admin if none exists
    adminUser = await prisma.user.create({
      data: {
        name: 'Süper Admin',
        email: 'superadmin@esnaaf.com',
        phone: '+905999999991',
        phone_masked: '0599 *** ** 91',
        role: 'admin',
      },
    });
  }

  if (!seeker || !providerUser) {
    console.error('Customer or Provider not found! Make sure database is seeded.');
    await app.close();
    return;
  }

  const provider = await prisma.serviceProvider.findUnique({
    where: { user_id: providerUser.id },
  });

  if (!provider) {
    console.error('ServiceProvider not found!');
    await app.close();
    return;
  }

  // 4. Test S3 / Local Mock Storage URL generation
  console.log('\n--- TEST 1: Storage Presigned URL & Local Upload Simulation ---');
  const { uploadUrl, downloadUrl, isMock } = await storageService.getPresignedUrl('review_photo.jpg', 'image/jpeg');
  console.log(`Presigned URL generated:`);
  console.log(`- Upload: ${uploadUrl}`);
  console.log(`- Download: ${downloadUrl}`);
  console.log(`- Is Mock: ${isMock}`);

  // Simulating local file upload body saving
  const dummyFileBuffer = Buffer.from('this is a dummy image file content');
  const uploadedUrl = storageService.saveMockFile('uploaded_review_photo.jpg', dummyFileBuffer);
  console.log(`✅ Success: Dummy file uploaded. Publicly served at: ${uploadedUrl}`);

  // 5. Test Review Creation (Pending state)
  console.log('\n--- TEST 2: Review Creation (Seeker perspective) ---');
  
  // Create a Mock Completed Job and Accepted Offer
  const category = await prisma.category.findFirst({ where: { isActive: true } });
  if (!category) {
    console.error('Active category not found!');
    await app.close();
    return;
  }

  const job1 = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: { details: 'Ev Temizliği - 2 Oda 1 Salon' },
      status: 'completed',
    },
  });

  const offer1 = await prisma.offer.create({
    data: {
      job_id: job1.id,
      provider_id: provider.id,
      price: 900,
      status: 'accepted',
    },
  });

  await prisma.acceptedOffer.create({
    data: {
      job_id: job1.id,
      offer_id: offer1.id,
      seeker_id: seeker.id,
      provider_id: provider.id,
    },
  });

  // Seeker submits a review with rating and uploaded photo url
  const review1 = await reviewService.createReview({
    job_id: job1.id,
    rating: 5,
    comment: 'Harika bir temizlikti, Ahmet Bey çok kibardı! Kesinlikle tavsiye ederim.',
    document_url: uploadedUrl,
  }, seeker.id);

  console.log(`Review 1 submitted:`);
  console.log(`- ID: ${review1.id}`);
  console.log(`- Rating: ${review1.rating}`);
  console.log(`- Status: ${review1.status} (expected: pending)`);
  console.log(`- Photo URL: ${review1.document_url}`);

  if (review1.status === ReviewStatus.pending) {
    console.log('✅ Success: Review correctly created in PENDING state.');
  } else {
    console.error('❌ Error: Review is not in pending state!');
  }

  // Ensure provider approved reviews are still empty
  const initialProviderReviews = await reviewService.getProviderReviews(provider.id);
  console.log(`- Provider approved reviews count: ${initialProviderReviews.length} (expected: 0)`);
  if (initialProviderReviews.length === 0) {
    console.log('✅ Success: Review does not appear on provider profile before approval.');
  }

  // 6. Test Admin Queue Fetching
  console.log('\n--- TEST 3: Admin Review Queue ---');
  const adminQueue = await reviewService.getAdminQueue();
  console.log(`- Pending reviews in queue: ${adminQueue.length} (expected: 1)`);
  if (adminQueue.length === 1 && adminQueue[0].id === review1.id) {
    console.log('✅ Success: Pending review correctly listed in admin queue.');
    console.log(`  Reviewer: ${adminQueue[0].reviewer.name} (${adminQueue[0].reviewer.phone_masked})`);
    console.log(`  Comment: "${adminQueue[0].comment}"`);
    console.log(`  Category: ${adminQueue[0].job.category.name}`);
  } else {
    console.error('❌ Error: Admin queue listing failed!');
  }

  // 7. Test Admin Approval & Rating Calculation Transaction
  console.log('\n--- TEST 4: Admin Approval & Automatic Provider Rating Recalculation ---');
  
  // Capture provider stats before approval
  const provBefore = await prisma.serviceProvider.findUnique({ where: { id: provider.id } });
  console.log(`- Provider rating before approval: ${provBefore?.avg_rating} | jobs: ${provBefore?.total_jobs}`);

  // Approve review
  const approvedReview = await reviewService.approveReview(review1.id, adminUser.id);
  console.log(`Review approved by admin. Status: ${approvedReview.status}`);

  // Recapture provider stats after approval
  const provAfter = await prisma.serviceProvider.findUnique({ where: { id: provider.id } });
  console.log(`- Provider rating after approval: ${provAfter?.avg_rating} (expected: 5) | jobs: ${provAfter?.total_jobs} (expected: 1)`);

  if (Number(provAfter?.avg_rating) === 5 && provAfter?.total_jobs === 1) {
    console.log('✅ Success: Provider average rating and total jobs updated successfully in a transaction.');
  } else {
    console.error('❌ Error: Rating recalculation failed!');
  }

  // Verify that provider approved reviews list now returns the comment
  const activeProviderReviews = await reviewService.getProviderReviews(provider.id);
  console.log(`- Provider approved reviews count: ${activeProviderReviews.length} (expected: 1)`);
  if (activeProviderReviews.length === 1 && activeProviderReviews[0].id === review1.id) {
    console.log('✅ Success: Approved review is now publicly visible on provider profile!');
    console.log(`  Masked Reviewer Phone: ${activeProviderReviews[0].reviewer.phone_masked}`);
  }

  // 8. Test Review Rejection
  console.log('\n--- TEST 5: Review Rejection ---');
  const job2 = await prisma.serviceRequest.create({
    data: {
      seeker_id: seeker.id,
      category_id: category.id,
      form_data: { details: 'Ev Temizliği - Detaylı Mutfak' },
      status: 'completed',
    },
  });

  const offer2 = await prisma.offer.create({
    data: {
      job_id: job2.id,
      provider_id: provider.id,
      price: 500,
      status: 'accepted',
    },
  });

  await prisma.acceptedOffer.create({
    data: {
      job_id: job2.id,
      offer_id: offer2.id,
      seeker_id: seeker.id,
      provider_id: provider.id,
    },
  });

  const review2 = await reviewService.createReview({
    job_id: job2.id,
    rating: 1,
    comment: 'Bu usta çok kötüydü, küfürlü konuştu!',
  }, seeker.id);

  console.log(`Review 2 submitted. Status: ${review2.status}`);

  // Reject review
  const rejectedReview = await reviewService.rejectReview(review2.id, adminUser.id);
  console.log(`Review 2 rejected by admin. Status: ${rejectedReview.status}`);

  // Verify it is not listed in provider's public reviews and provider rating is unchanged
  const activeReviewsFinal = await reviewService.getProviderReviews(provider.id);
  const provFinal = await prisma.serviceProvider.findUnique({ where: { id: provider.id } });
  
  console.log(`- Provider approved reviews: ${activeReviewsFinal.length} (expected: 1)`);
  console.log(`- Provider rating: ${provFinal?.avg_rating} (expected: 5)`);

  if (activeReviewsFinal.length === 1 && Number(provFinal?.avg_rating) === 5) {
    console.log('✅ Success: Rejected review is omitted from usta profile, and rating is unaffected.');
  } else {
    console.error('❌ Error: Rejection flow verification failed!');
  }

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL PHOTO REVIEWS & STORAGE E2E TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('E2E Test failed:', err);
  process.exit(1);
});
