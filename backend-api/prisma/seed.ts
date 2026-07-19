import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Ev Temizliği', isActive: true },
    { name: 'Boş Ev Temizliği', isActive: true },
    { name: 'Boya Badana', isActive: true },
    { name: 'Nakliyat / Ev Taşıma', isActive: true },
    { name: 'Su Tesisatı', isActive: true },
    { name: 'Elektrik Tesisatı', isActive: true },
    { name: 'Ev Tadilat', isActive: true },
    { name: 'Halı Yıkama', isActive: true },
    { name: 'Koltuk Yıkama', isActive: true },
    { name: 'İnşaat / Tadilat Sonrası Temizlik', isActive: true },
    { name: 'Fayans Döşeme', isActive: true },
    { name: 'Parke Döşeme', isActive: true },
    { name: 'Haşere İlaçlama', isActive: true },
    { name: 'Böcek İlaçlama', isActive: true },
    { name: 'Kombi Servisi', isActive: true },
    { name: 'Klima Servisi', isActive: true },
    { name: 'Mantolama', isActive: true },
    { name: 'Dış Cephe', isActive: true },
    { name: 'Marangoz', isActive: true },
    { name: 'Mobilya Montajı', isActive: true },
    { name: 'Özel Ders', isActive: true },
    { name: 'Cam Balkon', isActive: true },
    { name: 'PVC Pencere', isActive: true },
    { name: 'Ofis Temizliği', isActive: true },
    { name: 'İş Yeri Temizliği', isActive: true },
    { name: 'Doğalgaz Tesisatı', isActive: true },
    { name: 'İç Mimar', isActive: true },
    { name: 'Dekorasyon', isActive: true },
    { name: 'Fotoğrafçı', isActive: true },
    { name: 'Organizasyon', isActive: true },
    { name: 'Etkinlik', isActive: true },
  ];

  console.log('Seeding categories...');

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { isActive: category.isActive },
      create: { name: category.name, isActive: category.isActive },
    });
  }

  console.log('Seeding completed successfully!');

  // Seed default package configurations
  const packageConfigs = [
    { package_type: 'free', price: 0, commission_rate: 10, active_jobs_limit: 1, delay_minutes: 15 },
    { package_type: 'basic', price: 5000, commission_rate: 7, active_jobs_limit: 3, delay_minutes: 10 },
    { package_type: 'standard', price: 10000, commission_rate: 5, active_jobs_limit: 5, delay_minutes: 5 },
    { package_type: 'vip', price: 20000, commission_rate: 3, active_jobs_limit: 7, delay_minutes: 0 },
  ];

  console.log('Seeding package configurations...');
  for (const config of packageConfigs) {
    await prisma.systemPackageConfig.upsert({
      where: { package_type: config.package_type },
      update: {
        price: config.price,
        commission_rate: config.commission_rate,
        active_jobs_limit: config.active_jobs_limit,
        delay_minutes: config.delay_minutes,
      },
      create: {
        package_type: config.package_type,
        price: config.price,
        commission_rate: config.commission_rate,
        active_jobs_limit: config.active_jobs_limit,
        delay_minutes: config.delay_minutes,
      },
    });
  }

  console.log('Package configurations seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
