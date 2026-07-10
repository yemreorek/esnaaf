const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const req = await prisma.serviceRequest.findFirst({
    orderBy: { created_at: 'desc' }
  });
  console.log(`Latest request ID: ${req.id} (Created at: ${req.created_at})`);
  
  const jobOffers = await prisma.offer.findMany({ where: { job_id: req.id } });
  console.log(`Offers count: ${jobOffers.length}`);
  
  const acceptedOffer = await prisma.offer.findFirst({ where: { job_id: req.id, status: 'accepted' } });
  console.log(`Accepted offer: ${acceptedOffer ? 'Yes' : 'No'}`);
  
  const rts = await prisma.responseTime.findMany({
    where: { job_id: req.id }
  });
  console.log(`Response times count: ${rts.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
