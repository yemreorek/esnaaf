const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'kemal', mode: 'insensitive' } },
    include: { service_provider: true }
  });
  for (const u of users) {
    console.log(`- ${u.name} (Phone: ${u.phone}) (Provider ID: ${u.service_provider?.id})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
