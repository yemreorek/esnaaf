const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const req = await prisma.serviceRequest.findFirst({
    orderBy: { created_at: 'desc' },
    include: { category: true }
  });
  console.log(`Latest request ID: ${req.id} - Kategori: ${req.category.name}`);
  
  const rts = await prisma.responseTime.findMany({
    where: { job_id: req.id }
  });
  console.log(`Dağıtılan usta sayısı: ${rts.length}`);
  for (const rt of rts) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: rt.provider_id },
      include: { user: true }
    });
    console.log(`- ${provider.user.name} (Kategori ID'leri: ${provider.category_ids.join(', ')})`);
  }

  const kemal = await prisma.user.findFirst({ where: { name: { contains: 'kemal', mode: 'insensitive' } } });
  if (kemal) {
    const kemalProv = await prisma.serviceProvider.findFirst({ where: { user_id: kemal.id }});
    console.log(`Kemal Usta ID: ${kemal.id}`);
    console.log(`Kemal Usta Kategori ID'leri: ${kemalProv.category_ids.join(', ')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
