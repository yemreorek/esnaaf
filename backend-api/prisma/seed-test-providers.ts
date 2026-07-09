import { PrismaClient, UserRole, SubscriptionStatus, PackageType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Test hesapları oluşturma başlatıldı...');

  // 1. Haşere & Böcek İlaçlama kategorisini bul veya oluştur
  let category = await prisma.category.findUnique({
    where: { name: 'Haşere & Böcek İlaçlama' },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Haşere & Böcek İlaçlama',
        isActive: true,
      },
    });
  }

  const categoryId = category.id;

  // Hesap verileri
  const providersData = [
    {
      name: 'Böcek VIP Ahmet',
      phone: '+905550000001',
      phone_masked: '+90 555 *** ** 01',
      packageType: PackageType.vip,
    },
    {
      name: 'Böcek VIP Mehmet',
      phone: '+905550000002',
      phone_masked: '+90 555 *** ** 02',
      packageType: PackageType.vip,
    },
    {
      name: 'Böcek Standart Selim',
      phone: '+905550000003',
      phone_masked: '+90 555 *** ** 03',
      packageType: PackageType.standard,
    },
    {
      name: 'Böcek Basic Bekir',
      phone: '+905550000004',
      phone_masked: '+90 555 *** ** 04',
      packageType: PackageType.basic,
    },
    {
      name: 'Böcek Hızlı Hasan',
      phone: '+905550000005',
      phone_masked: '+90 555 *** ** 05',
      packageType: null, // Free
    },
    {
      name: 'Böcek Ucuz Osman',
      phone: '+905550000006',
      phone_masked: '+90 555 *** ** 06',
      packageType: null, // Free
    },
    {
      name: 'Böcek Pratik Hakan',
      phone: '+905550000007',
      phone_masked: '+90 555 *** ** 07',
      packageType: null, // Free
    },
    {
      name: 'Böcek Temiz Turgut',
      phone: '+905550000008',
      phone_masked: '+90 555 *** ** 08',
      packageType: null, // Free
    },
  ];

  for (const item of providersData) {
    // Önce varsa eski verileri sil/güncelle
    const existingUser = await prisma.user.findUnique({
      where: { phone: item.phone },
      include: { service_provider: { include: { subscription: true } } },
    });

    if (existingUser) {
      // Temizlik yapalım
      if (existingUser.service_provider) {
        if (existingUser.service_provider.subscription) {
          await prisma.subscription.delete({
            where: { id: existingUser.service_provider.subscription.id },
          });
        }
        await prisma.serviceProvider.delete({
          where: { id: existingUser.service_provider.id },
        });
      }
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
    }

    // 2. Yeni User oluştur
    const newUser = await prisma.user.create({
      data: {
        phone: item.phone,
        phone_masked: item.phone_masked,
        name: item.name,
        role: UserRole.service_provider,
        esnaaf_id: item.phone.replace('+', ''),
        kvkk_consent: true,
        kvkk_consent_date: new Date(),
        marketing_consent: true,
        is_active: true,
      },
    });

    // 3. ServiceProvider oluştur
    const provider = await prisma.serviceProvider.create({
      data: {
        user_id: newUser.id,
        category_ids: [categoryId],
        description: `${item.name} - Adana geneli profesyonel haşere ve böcek ilaçlama hizmetleri.`,
        avg_rating: 4.8,
        total_jobs: 12,
        is_approved: true,
        approved_at: new Date(),
        account_status: 'active',
        city: 'Adana',
        service_districts: ['Seyhan', 'Çukurova', 'Yüreğir'],
      },
    });

    // 4. Paket tipine göre subscription oluştur
    if (item.packageType) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 yıl sonra sona ersin

      const sub = await prisma.subscription.create({
        data: {
          provider_id: provider.id,
          package_type: item.packageType,
          status: SubscriptionStatus.active,
          started_at: new Date(),
          expires_at: expiresAt,
        },
      });

      // ServiceProvider subscription_id'yi bağla
      await prisma.serviceProvider.update({
        where: { id: provider.id },
        data: { subscription_id: sub.id },
      });
    }

    console.log(`✓ ${item.name} (${item.phone}) başarıyla oluşturuldu. Paket: ${item.packageType || 'Ücretsiz'}`);
  }

  console.log('Tüm test hesapları başarıyla oluşturuldu.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
