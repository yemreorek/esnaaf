const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const reqs = await prisma.serviceRequest.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: { category: true }
  });

  console.log('--- SON 5 TALEP ---');
  for (const r of reqs) {
    const localTime = new Date(new Date(r.created_at).getTime() + 3*60*60*1000).toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${localTime}] Kategori: ${r.category.name} | İlçe: ${r.district} | Form: ${JSON.stringify(r.form_data)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
