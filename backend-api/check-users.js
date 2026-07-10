const { PrismaClient } = require('./node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'
    }
  }
});

async function main() {
  console.log('🔄 Kullanıcılar kontrol ediliyor...');
  
  const providers = await prisma.serviceProvider.findMany({
    include: {
      user: true,
      category_ids: false // category_ids string[] olduğu için include gerekmiyor
    }
  });

  console.log('--- TÜM USTALAR ---');
  for (const p of providers) {
    if (p.user.name.toLowerCase().includes('ayhan') || 
        p.user.name.toLowerCase().includes('aylin') || 
        p.user.name.toLowerCase().includes('böcek') ||
        p.user.name.toLowerCase().includes('bocek')) {
      console.log(`- İsim: ${p.user.name} | Tel: ${p.user.phone} | Aktif mi (Account Status): ${p.account_status} | Onaylı mı: ${p.is_approved} | Silinmiş mi: ${p.user.deleted_at ? 'EVET' : 'HAYIR'}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
