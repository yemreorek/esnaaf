const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: '34617f1a-e264-4afa-938d-618d534b5cb6' },
    include: { service_provider: true }
  });
  console.log(user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
