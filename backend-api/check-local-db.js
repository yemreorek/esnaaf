const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient(); // uses local .env DATABASE_URL

async function main() {
  const reqs = await prisma.serviceRequest.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: { category: true }
  });

  console.log('--- LOKAL VERITABANI SON 5 TALEP ---');
  for (const r of reqs) {
    const localTime = new Date(new Date(r.created_at).getTime() + 3*60*60*1000).toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${localTime}] Kategori: ${r.category.name} | İlçe: ${r.district} | Form: ${JSON.stringify(r.form_data)}`);
    
    const rts = await prisma.responseTime.findMany({ where: { job_id: r.id }, include: { provider: { include: { user: true } } } });
    console.log(`  > Dağıtılan Ustalar: ${rts.map(rt => rt.provider.user.name).join(', ')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
