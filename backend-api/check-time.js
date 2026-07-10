const { PrismaClient } = require('./node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'
    }
  }
});

async function main() {
  const result = await prisma.$queryRaw`SELECT NOW() as db_now`;
  console.log('NodeJS Local Date.now():', new Date().toISOString());
  console.log('Postgres DB NOW():', result[0].db_now);
  
  const reqs = await prisma.serviceRequest.findMany({
    orderBy: { created_at: 'desc' },
    take: 1
  });
  console.log('Son Talep created_at:', reqs[0]?.created_at?.toISOString());
}

main().catch(console.error).finally(() => prisma.$disconnect());
