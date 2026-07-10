const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const users = await prisma.user.findMany({
    where: { 
      role: 'service_seeker',
      created_at: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) } // Last 24 hours
    },
    orderBy: { created_at: 'desc' }
  });
  console.log(`Found ${users.length} recent service seekers.`);
  for(const u of users) {
    console.log(`ID: ${u.id} | Masked: ${u.phone_masked} | Created: ${u.created_at}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
