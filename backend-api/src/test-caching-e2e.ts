import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisService } from './common/redis/redis.service';
import { AuthService } from './ortak/auth/auth.service';
import { HizmetverenService } from './hizmetveren/hizmetveren.service';
import { PrismaService } from './common/prisma/prisma.service';

async function run() {
  console.log('=== STARTING REDIS CACHING AND INVALIDATION E2E TEST ===');

  // 1. Bootstrap NestJS Context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Context Bootstrapped.');

  const redis = app.get(RedisService);
  const authService = app.get(AuthService);
  const hizmetverenService = app.get(HizmetverenService);
  const prisma = app.get(PrismaService);

  // ==========================================
  // TEST 1: RedisService.getOrSet Testi
  // ==========================================
  console.log('\n--- TEST 1: RedisService getOrSet ---');
  const testKey = 'test:caching:getorset';
  await redis.del(testKey);

  let counter = 0;
  const fetchData = async () => {
    counter++;
    return { data: 'hello_world', count: counter };
  };

  // İlk çağrı: db/callback çalışmalı
  const res1 = await redis.getOrSet(testKey, fetchData, 30);
  console.log('Call 1 Result:', res1);

  // İkinci çağrı: cache'ten gelmeli, counter artmamalı
  const res2 = await redis.getOrSet(testKey, fetchData, 30);
  console.log('Call 2 Result:', res2);

  if (res1.count === 1 && res2.count === 1) {
    console.log('✅ TEST 1 verified: getOrSet works with caching.');
  } else {
    console.error('❌ TEST 1 failed: getOrSet did not reuse cached values!');
    await app.close();
    process.exit(1);
  }

  // ==========================================
  // TEST 2: AuthService.getCategories Caching Testi
  // ==========================================
  console.log('\n--- TEST 2: AuthService getCategories Caching ---');
  await redis.del('categories:active');

  // Kategorileri çek (cache'e yazması gerekir)
  const categories = await authService.getCategories();
  console.log(`Fetched ${categories.length} categories.`);

  // Redis'te cache'in oluşup oluşmadığına bak
  const cachedCategories = await redis.get('categories:active');
  if (cachedCategories) {
    console.log('✅ TEST 2 verified: categories:active successfully cached.');
  } else {
    console.error('❌ TEST 2 failed: categories:active was not found in Redis!');
    await app.close();
    process.exit(1);
  }

  // ==========================================
  // TEST 3: HizmetverenService.getProfile and Invalidation Testi
  // ==========================================
  console.log('\n--- TEST 3: HizmetverenService getProfile & Invalidation ---');
  
  // Find a seeded service provider
  const providerUser = await prisma.user.findFirst({
    where: { role: 'service_provider' }
  });

  if (!providerUser) {
    console.error('❌ Provider user not found! Make sure database is seeded.');
    await app.close();
    process.exit(1);
  }

  const profileCacheKey = `provider:profile:${providerUser.id}`;
  await redis.del(profileCacheKey);

  // Profile'ı ilk defa çek (cache'lenmeli)
  const profile1 = await hizmetverenService.getProfile(providerUser.id);
  console.log(`Provider profile fetched. ID: ${profile1.id}, HealthScore: ${profile1.healthScore}`);

  const cachedProfile = await redis.get(profileCacheKey);
  if (!cachedProfile) {
    console.error('❌ TEST 3 failed: provider profile was not cached!');
    await app.close();
    process.exit(1);
  }
  console.log('Verified profile cache exists in Redis.');

  // Profil konum bilgilerini güncelleyerek cache invalidation'ı tetikle
  console.log('Updating provider profile to trigger invalidation...');
  await hizmetverenService.updateProfile(providerUser.id, {
    city: 'İstanbul',
    serviceDistricts: ['Kadıköy', 'Şişli']
  });

  // Redis'te cache'in silindiğini doğrula
  const cachedProfileAfterUpdate = await redis.get(profileCacheKey);
  if (!cachedProfileAfterUpdate) {
    console.log('✅ TEST 3 verified: provider profile cache successfully deleted on updateProfile.');
  } else {
    console.error('❌ TEST 3 failed: cache was NOT cleared after profile update!');
    await app.close();
    process.exit(1);
  }

  // Clean up test keys
  await redis.del(testKey);
  await redis.del('categories:active');

  console.log('\n=== ALL REDIS CACHING AND INVALIDATION TESTS SUCCEEDED ===');
  await app.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('E2E Test failed:', err);
  process.exit(1);
});
