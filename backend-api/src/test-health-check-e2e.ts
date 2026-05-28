import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PrismaService } from './common/prisma/prisma.service';
import { ServiceUnavailableException } from '@nestjs/common';

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING BACKEND HEALTH MONITORING E2E INTEGRATION TEST ===');
  console.log('===========================================================');

  // 1. Bootstrap NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('NestJS Application Context Bootstrapped.');

  const appService = app.get(AppService);
  const appController = app.get(AppController);
  const prisma = app.get(PrismaService);

  // --- TEST 1: Healthy Connectivity ---
  console.log('\n--- TEST 1: Healthy System Health Status ---');
  const res1 = await appService.checkHealth();
  console.log('Health check response:', JSON.stringify(res1));

  if (res1.status === 'UP' && res1.database === 'UP' && res1.redis === 'UP') {
    console.log('✅ Success: Overall health status is UP as expected!');
  } else {
    console.error('❌ Error: Expected health status to be UP, but got:', res1);
    await app.close();
    process.exit(1);
  }

  // --- TEST 2: Controller Endpoint Health Verification ---
  console.log('\n--- TEST 2: Controller Health Check Endpoint Response ---');
  const res2 = await appController.getHealth();
  console.log('Controller endpoint health response:', JSON.stringify(res2));

  if (res2.success === true && res2.status === 'UP') {
    console.log('✅ Success: Controller endpoint returned HTTP 200 health check successfully!');
  } else {
    console.error('❌ Error: Health check controller endpoint returned unexpected response:', res2);
    await app.close();
    process.exit(1);
  }

  // --- TEST 3: Simulating Database Connectivity Failure ---
  console.log('\n--- TEST 3: Simulating Database Connectivity Failure ---');
  
  // Back up the original prisma $queryRaw method
  const originalQueryRaw = prisma.$queryRaw;

  // Mock $queryRaw to reject with an error
  (prisma as any).$queryRaw = async () => {
    throw new Error('Deterministik test veritabanı çökmesi hatası.');
  };

  const res3 = await appService.checkHealth();
  console.log('Simulated database down response:', JSON.stringify(res3));

  if (res3.status === 'DOWN' && res3.database === 'DOWN') {
    console.log('✅ Success: Database failure correctly detected and status marked as DOWN!');
  } else {
    console.error('❌ Error: Expected database status to be DOWN, but got:', res3);
    // Restore and exit
    (prisma as any).$queryRaw = originalQueryRaw;
    await app.close();
    process.exit(1);
  }

  // Verify that the controller throws ServiceUnavailableException during database failure
  try {
    await appController.getHealth();
    console.error('❌ Error: Expected controller to throw ServiceUnavailableException, but it completed successfully.');
    (prisma as any).$queryRaw = originalQueryRaw;
    await app.close();
    process.exit(1);
  } catch (err) {
    if (err instanceof ServiceUnavailableException) {
      console.log('✅ Success: Controller correctly threw ServiceUnavailableException during database outage!');
      console.log('  HTTP Exception Response:', JSON.stringify(err.getResponse()));
    } else {
      console.error('❌ Error: Expected ServiceUnavailableException but got:', err);
      (prisma as any).$queryRaw = originalQueryRaw;
      await app.close();
      process.exit(1);
    }
  }

  // Restore prisma $queryRaw
  (prisma as any).$queryRaw = originalQueryRaw;

  console.log('\n===========================================================');
  console.log('=== 🎉 ALL HEALTH CHECK MONITORING E2E TESTS PASSED 🎉 ===');
  console.log('===========================================================');

  await app.close();
}

run().catch(async (e) => {
  console.error('❌ E2E Health Check Test execution failed:', e);
  process.exit(1);
});
