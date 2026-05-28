import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Ev Temizliği', isActive: true },
    { name: 'Boya Badana', isActive: true },
    { name: 'Nakliyat / Ev Taşıma', isActive: true },
    { name: 'Su Tesisatı', isActive: true },
    { name: 'Elektrik Tesisatı', isActive: true },
    { name: 'Ev Tadilat', isActive: true },
    { name: 'Halı & Koltuk Yıkama', isActive: true },
    { name: 'İnşaat / Tadilat Sonrası Temizlik', isActive: true },
    { name: 'Fayans & Parke Döşeme', isActive: true },
    { name: 'Haşere & Böcek İlaçlama', isActive: true },
    { name: 'Kombi & Klima Bakımı', isActive: true },
    { name: 'Mantolama & Dış Cephe', isActive: true },
    { name: 'Marangoz & Mobilya Montajı', isActive: true },
    { name: 'Özel Ders', isActive: true },
    { name: 'Cam Balkon & PVC Pencere', isActive: true },
    { name: 'Ofis & İş Yeri Temizliği', isActive: true },
    { name: 'Doğalgaz Tesisatı', isActive: true },
    { name: 'İç Mimar & Dekorasyon', isActive: true },
    { name: 'Fotoğrafçı', isActive: true },
    { name: 'Organizasyon & Etkinlik', isActive: true },
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
