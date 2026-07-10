const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const req = await prisma.serviceRequest.findFirst({
    orderBy: { created_at: 'desc' }
  });
  console.log(`Latest request ID: ${req.id} (Created at: ${req.created_at})`);
  
  const rts = await prisma.responseTime.findMany({
    where: { job_id: req.id }
  });
  console.log(`Dağıtılan usta sayısı: ${rts.length}`);
  for (const rt of rts) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: rt.provider_id },
      include: { user: true }
    });
    console.log(`- ${provider.user.name} (Provider ID: ${rt.provider_id})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
