const { PrismaClient } = require('c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'
    }
  }
});

async function run() {
  try {
    console.log('Connecting to production database via Prisma...');
    const usersCount = await prisma.user.count();
    console.log('Connection successful! Total users in production database:', usersCount);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
