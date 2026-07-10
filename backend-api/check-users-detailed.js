const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const users = await prisma.user.findMany({
    where: { 
      OR: [
        { phone: '753ec1cf93a22269e67eb40fc130cf20' }, // Kemal's phone? Wait, let's just use raw query if encryption is an issue, but let's check all users to find Mert Yilmaz and Kemal Usta
        { name: { contains: 'Mert', mode: 'insensitive' } },
        { name: { contains: 'Kemal', mode: 'insensitive' } },
        { name: { contains: 'Ayhan', mode: 'insensitive' } }
      ]
    },
    include: { service_provider: true }
  });
  
  for (const u of users) {
    console.log(`- ID: ${u.id} | Name: ${u.name} | PhoneMasked: ${u.phone_masked}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
