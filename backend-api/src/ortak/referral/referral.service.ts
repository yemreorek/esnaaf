import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReferralType, Referral, CampaignType, PackageType } from '@prisma/client';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  /**
   * Deterministik olarak kullanıcının tekil referans kodunu üretir.
   * Format: [İSMİN_İLK_4_HARFİ][UUID_İLK_4_KARAKTERİ] (Örn: EMRE9096)
   */
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const namePart = user.name
      ? user.name.replace(/\s+/g, '').substring(0, 4).toUpperCase()
      : 'ESNF';
    const uuidPart = user.id.substring(0, 4).toLowerCase();

    return `${namePart}${uuidPart}`;
  }

  /**
   * Referans kodunun geçerliliğini denetler ve eşleme kaydını oluşturur.
   */
  async applyReferralCode(refereeUserId: string, code: string): Promise<Referral> {
    if (!code || code.length < 5) {
      throw new BadRequestException('Geçersiz referans kodu formatı.');
    }

    // 1. Kodu çözümle: Son 4 hane UUID parçası, geri kalanı isim parçasıdır.
    const uuidPart = code.substring(code.length - 4).toLowerCase();
    const namePart = code.substring(0, code.length - 4).toUpperCase();

    // 2. UUID parçasına göre memory araması yap.
    const users = await this.prisma.user.findMany({
      where: { is_active: true },
    });

    const referrer = users.find((u) => u.id.substring(0, 4).toLowerCase() === uuidPart);

    if (!referrer) {
      throw new NotFoundException('Geçersiz veya bulunamayan referans kodu.');
    }

    // İsmin doğruluğunu teyit et
    const expectedNamePart = referrer.name
      ? referrer.name.replace(/\s+/g, '').substring(0, 4).toUpperCase()
      : 'ESNF';

    if (expectedNamePart !== namePart) {
      throw new BadRequestException('Referans kodu doğrulaması başarısız oldu.');
    }

    // 3. Güvenlik kuralları denetimleri
    if (referrer.id === refereeUserId) {
      throw new BadRequestException('Kendinizi referans gösteremezsiniz.');
    }

    // Referee zaten daha önce başka bir kodla eşleşmiş mi?
    const existingReferral = await this.prisma.referral.findUnique({
      where: { referee_id: refereeUserId },
    });

    if (existingReferral) {
      throw new BadRequestException('Zaten bir referans kodu kullanarak kayıt oldunuz.');
    }

    // Referee ve Referrer rollerini al
    const referee = await this.prisma.user.findUnique({
      where: { id: refereeUserId },
    });

    if (!referee) {
      throw new NotFoundException('Davet edilen kullanıcı bulunamadı.');
    }

    // Tipi ve ödülü davet edilen kişinin rolüne göre belirle
    let type: ReferralType = ReferralType.seeker_credit;
    let rewardAmount = 100; // HA referansı -> 100 TL

    if (referee.role === 'service_provider') {
      type = ReferralType.provider_discount;
      rewardAmount = 500; // HV referansı -> 500 TL
    }

    // 4. Referans kaydını oluştur
    return this.prisma.referral.create({
      data: {
        referrer_id: referrer.id,
        referee_id: refereeUserId,
        code,
        type,
        reward_amount: rewardAmount,
        rewarded: false,
      },
    });
  }

  /**
   * Davet edilen Seeker ilk işini bitirdiğinde tetiklenir (100 TL kredi verir).
   */
  async triggerSeekerReward(refereeUserId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { referee_id: refereeUserId },
    });

    if (!referral || referral.type !== ReferralType.seeker_credit || referral.rewarded) {
      return; // Ödül koşulu yok veya zaten ödüllendirildi
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Referans kaydını ödüllendirildi olarak işaretle
      await tx.referral.update({
        where: { referee_id: refereeUserId },
        data: {
          rewarded: true,
          rewarded_at: new Date(),
        },
      });

      // 2. Davet eden kullanıcının (referrer) balance alanına 100 TL kredi ekle
      await tx.user.update({
        where: { id: referral.referrer_id },
        data: {
          balance: { increment: referral.reward_amount },
        },
      });

      console.log(`[Referral Reward Success] 100 TL Seeker Credit added to User ${referral.referrer_id} for inviting Seeker ${refereeUserId}`);
    });
  }

  /**
   * Davet edilen Provider ilk paket aboneliğini satın aldığında tetiklenir (500 TL indirim kodu üretir).
   */
  async triggerProviderReward(refereeProviderId: string) {
    // Hizmet verenin bağlı kullanıcı hesabını (user_id) bul
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: refereeProviderId },
    });

    if (!provider) return;

    const referral = await this.prisma.referral.findUnique({
      where: { referee_id: provider.user_id },
    });

    if (!referral || referral.type !== ReferralType.provider_discount || referral.rewarded) {
      return; // Ödül koşulu yok veya zaten ödüllendirildi
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Referans kaydını ödüllendirildi olarak işaretle
      await tx.referral.update({
        where: { referee_id: provider.user_id },
        data: {
          rewarded: true,
          rewarded_at: new Date(),
        },
      });

      if (!referral.referee_id) return;

      // 2. Davet eden HV için 500 TL değerinde tekil indirim kodu üret.
      // Kod formatı: REF-HV-[Referrer UUID ilk 6 hane]-[Referee UUID son 4 hane]
      const campaignCode = `REF-HV-${referral.referrer_id.substring(0, 6).toUpperCase()}-${referral.referee_id.substring(referral.referee_id.length - 4).toUpperCase()}`;

      await tx.campaign.create({
        data: {
          name: `Referans Ödülü - 500 TL İndirim`,
          code: campaignCode,
          type: CampaignType.fixed,
          value: referral.reward_amount,
          valid_from: new Date(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün geçerli
          is_active: true,
          max_uses: 1, // Tek kullanımlık
          new_users_only: false,
          applicable_packages: [PackageType.standard, PackageType.premium, PackageType.vip],
        },
      });

      console.log(`[Referral Reward Success] 500 TL Provider Discount Campaign ${campaignCode} generated for User ${referral.referrer_id} for inviting Provider ${refereeProviderId}`);
    });
  }
}
