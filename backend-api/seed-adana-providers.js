const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Set DATABASE_URL programmatically to connect to the GCP production instance
process.env.DATABASE_URL = "postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2/esnaaf_db?schema=public";

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-cbc';
const PROD_KEY = '718e244ef06b4da7ba60e1d8cc5c28ad';
const PROD_IV = '92a83bd82c6742fb';

function encryptPhone(phone) {
  if (!phone) return '';
  const keyBuf = Buffer.from(PROD_KEY.substring(0, 32).padEnd(32, 'a'));
  const ivBuf = Buffer.from(PROD_IV.substring(0, 16).padEnd(16, 'b'));
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuf, ivBuf);
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function maskPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  let localDigits = digits;
  if (digits.startsWith('90') && digits.length === 12) {
    localDigits = digits.substring(2);
  }
  if (localDigits.length === 10) {
    const area = localDigits.substring(0, 3);
    const last = localDigits.substring(8);
    return `0${area} *** ** ${last}`;
  }
  return phone.substring(0, 4) + ' *** ** ' + phone.substring(phone.length - 2);
}

async function main() {
  console.log('--- SEEDING APPROVED ADANA PROVIDERS FOR ALL CATEGORIES ON GCP ---');

  // 1. Get All Categories
  const categories = await prisma.category.findMany();
  const categoryIds = categories.map(c => c.id);
  console.log(`Found ${categories.length} categories in DB.`);

  // 2. Define 2 Approved Providers in Adana
  const mockProviders = [
    {
      name: 'Kemal Usta (Adana Kombi, Klima ve Temizlik)',
      phone: '+905329999901',
      email: 'kemal.adana@gmail.com',
      rating: 4.8,
      districts: ['Çukurova', 'Seyhan', 'Sarıçam', 'Yüreğir', 'Ceyhan']
    },
    {
      name: 'Aylin Teknik (Adana Hizmet Grubu)',
      phone: '+905329999902',
      email: 'aylin.temizlik.adana@gmail.com',
      rating: 4.9,
      districts: ['Çukurova', 'Seyhan']
    }
  ];

  for (const item of mockProviders) {
    const encryptedNum = encryptPhone(item.phone);
    const user = await prisma.user.upsert({
      where: { phone: encryptedNum },
      update: { 
        name: item.name, 
        role: 'service_provider',
        is_active: true 
      },
      create: {
        phone: encryptedNum,
        phone_masked: maskPhone(item.phone),
        name: item.name,
        email: item.email,
        role: 'service_provider',
        kvkk_consent: true,
        kvkk_consent_date: new Date(),
        is_active: true,
      },
    });

    const provider = await prisma.serviceProvider.upsert({
      where: { user_id: user.id },
      update: {
        category_ids: categoryIds, // Supporting ALL categories!
        is_approved: true,
        approved_at: new Date(),
        city: 'Adana',
        service_districts: item.districts,
        avg_rating: item.rating,
      },
      create: {
        user_id: user.id,
        category_ids: categoryIds, // Supporting ALL categories!
        is_approved: true,
        approved_at: new Date(),
        city: 'Adana',
        service_districts: item.districts,
        avg_rating: item.rating,
      },
    });
    console.log(`✅ Seeded Approved Provider: ${user.name} | ID: ${provider.id} | Districts: ${item.districts.join(', ')}`);
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
