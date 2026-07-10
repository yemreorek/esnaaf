const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'Ayhan', mode: 'insensitive' } },
    include: { service_provider: { include: { service_categories: { include: { category: true } } } } }
  });
  
  for (const u of users) {
    console.log(`- ${u.name}`);
    for (const sc of u.service_provider.service_categories) {
      console.log(`  * ${sc.category.name}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
