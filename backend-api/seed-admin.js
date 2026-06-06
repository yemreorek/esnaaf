require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-cbc';
function getKeys() {
  const key = process.env.ENCRYPTION_KEY || 'default_32_chars_long_key_12345';
  const iv = process.env.ENCRYPTION_IV || 'default_16_ch_iv';
  return {
    key: Buffer.from(key.substring(0, 32).padEnd(32, 'a')),
    iv: Buffer.from(iv.substring(0, 16).padEnd(16, 'b')),
  };
}

function encryptPhone(phone) {
  if (!phone) return '';
  const { key, iv } = getKeys();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
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
  console.log('--- SEEDING ADMIN & UNAPPROVED PROVIDERS ---');

  // 1. Create/Verify Staff and Admin Users
  const mockStaff = [
    {
      name: 'Mert Yılmaz',
      phone: '+905999999999',
      email: 'admin@esnaaf.com',
      staffRole: 'super_admin',
    },
    {
      name: 'Can Demir',
      phone: '+905329990011',
      email: 'can.demir@esnaaf.com',
      staffRole: 'quality_staff',
    },
    {
      name: 'Elif Kaya',
      phone: '+905449992233',
      email: 'elif.kaya@esnaaf.com',
      staffRole: 'ops_staff',
    },
    {
      name: 'Burak Yılmaz',
      phone: '+905559994455',
      email: 'burak.yilmaz@esnaaf.com',
      staffRole: 'finance_staff',
    },
  ];

  for (const item of mockStaff) {
    const encryptedPhoneNum = encryptPhone(item.phone);
    const user = await prisma.user.upsert({
      where: { phone: encryptedPhoneNum },
      update: { name: item.name, role: 'admin', email: item.email, is_active: true, deleted_at: null },
      create: {
        phone: encryptedPhoneNum,
        phone_masked: maskPhone(item.phone),
        name: item.name,
        email: item.email,
        role: 'admin',
        kvkk_consent: true,
        kvkk_consent_date: new Date(),
        is_active: true,
      },
    });

    const staff = await prisma.staff.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        phone: item.phone,
        role: item.staffRole,
        is_active: true,
      },
      create: {
        name: item.name,
        email: item.email,
        phone: item.phone,
        role: item.staffRole,
        is_active: true,
      },
    });
    console.log(`Seeded Staff Member: ${staff.name} | Role: ${staff.role} | Phone: ${item.phone} (User ID: ${user.id})`);
  }

  // 2. Get Ev Temizliği Category
  const category = await prisma.category.findUnique({
    where: { name: 'Ev Temizliği' },
  });
  if (!category) {
    console.error('Ev Temizliği category not found!');
    return;
  }

  // 3. Create 2 Pending (Unapproved) Providers
  const mockPending = [
    {
      name: 'Usta Davut (Onay Bekliyor)',
      phone: '+905320000100',
    },
    {
      name: 'Usta Kenan (Onay Bekliyor)',
      phone: '+905320000200',
    },
  ];

  for (const item of mockPending) {
    const encryptedNum = encryptPhone(item.phone);
    const user = await prisma.user.upsert({
      where: { phone: encryptedNum },
      update: { name: item.name },
      create: {
        phone: encryptedNum,
        phone_masked: maskPhone(item.phone),
        name: item.name,
        email: item.name.toLowerCase().replace(/ /g, '') + '@gmail.com',
        role: 'service_provider',
        kvkk_consent: true,
        kvkk_consent_date: new Date(),
        is_active: true,
      },
    });

    const provider = await prisma.serviceProvider.upsert({
      where: { user_id: user.id },
      update: {
        category_ids: [category.id],
        is_approved: false, // Explicitly unapproved
        approved_at: null,
      },
      create: {
        user_id: user.id,
        category_ids: [category.id],
        is_approved: false, // Explicitly unapproved
        approved_at: null,
      },
    });
    console.log(`Created Pending Provider: ${user.name} | ID: ${provider.id}`);
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
