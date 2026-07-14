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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
