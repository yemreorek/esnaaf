const { PrismaClient } = require('./node_modules/@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'
    }
  }
});

async function main() {
  console.log('🔄 [CANLI VERİTABANI] Hizmet veren hesap durumları güncelleniyor...');
  
  const result = await prisma.serviceProvider.updateMany({
    where: {
      is_approved: true,
      account_status: 'pending_approval'
    },
    data: {
      account_status: 'active'
    }
  });

  console.log(`✅ İşlem tamamlandı! Toplam güncellenen usta sayısı: ${result.count}`);
}

main()
  .catch((e) => {
    console.error('❌ Hata oluştu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
