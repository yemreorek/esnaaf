const { PrismaClient } = require('./node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'
    }
  }
});

async function main() {
  const reqs = await prisma.serviceRequest.findMany({
    orderBy: { created_at: 'desc' },
    take: 2,
    include: {
      category: true
    }
  });

  console.log('--- SON 2 TALEP ---');
  for (const r of reqs) {
    console.log(`- Kategori: ${r.category.name} (${r.category_id}) | İl/İlçe: ${r.city}/${r.district}`);
    
    // Usta eşleşmesine bakalım
    const providers = await prisma.serviceProvider.findMany({
      where: {
        is_approved: true,
        account_status: 'active',
        category_ids: { has: r.category_id }
      },
      include: { user: true }
    });
    console.log(`  Bu kategoriye uygun Aktif ve Onaylı Usta Sayısı: ${providers.length}`);
    for (const p of providers) {
      console.log(`    > ${p.user.name} | İl: ${p.city} | İlçeler: ${p.service_districts.join(',')}`);
    }
    
    // Gönderilen ustalar
    const rts = await prisma.responseTime.findMany({
      where: { job_id: r.id }
    });
    console.log(`  Dağıtılan Usta Sayısı (ResponseTime): ${rts.length}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
