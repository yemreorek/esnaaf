const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: { contains: 'Mert Yılmaz' } }
  });
  console.log('Mert Yılmaz:', user);
  
  const ayhan = await prisma.user.findFirst({
    where: { name: { contains: 'Ayhan' } }
  });
  console.log('Ayhan:', ayhan);
}

main().catch(console.error).finally(() => prisma.$disconnect());
