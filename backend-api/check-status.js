const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const req = await prisma.serviceRequest.findFirst({
    orderBy: { created_at: 'desc' }
  });
  console.log(`Latest request ID: ${req.id}`);
  console.log(`Status: ${req.status}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
