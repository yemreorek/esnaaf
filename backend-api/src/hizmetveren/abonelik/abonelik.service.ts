import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IyzicoService } from './iyzico.service';
import { AbonelikBaslatDto } from './dto/abonelik.dto';
import { PackageType, SubscriptionStatus, PaymentStatus, AlarmLevel, DisputeStatus, JobCompletionStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { ReferralService } from '../../ortak/referral/referral.service';

@Injectable()
export class AbonelikService {
  private readonly logger = new Logger(AbonelikService.name);

  constructor(
    private prisma: PrismaService,
    private iyzicoService: IyzicoService,
    @InjectQueue('payment-retry') private paymentQueue: Bull.Queue,
    private referralService: ReferralService,
  ) {}

  /**
   * Paketleri listeler
   */
  async getPackages() {
    return [
      { 
        type: PackageType.basic, 
        price: 5000, 
        quota: null, 
        commissionRate: 10,
        activeJobsLimit: 3,
        name: 'Basic Paket (Düşük)', 
        description: 'Aylık 5.000 TL Sabit Ücret. Sınırsız Teklif Hakkı. %10 İş Sonu Komisyonu. Aynı anda en fazla 3 aktif iş (Kapasite Kilidi). Normal Dağıtım (15 dk gecikmeli).' 
      },
      { 
        type: PackageType.standard, 
        price: 10000, 
        quota: null, 
        commissionRate: 7,
        activeJobsLimit: 5,
        name: 'Standart Paket (Orta)', 
        description: 'Aylık 10.000 TL Sabit Ücret. Sınırsız Teklif Hakkı. %7 İş Sonu Komisyonu. Aynı anda en fazla 5 aktif iş (Kapasite Kilidi). Hızlı Dağıtım (5 dk gecikmeli).' 
      },
      { 
        type: PackageType.vip, 
        price: 20000, 
        quota: null, 
        commissionRate: 5,
        activeJobsLimit: 7,
        name: 'VIP Paket (Yüksek)', 
        description: 'Aylık 20.000 TL Sabit Ücret. Sınırsız Teklif Hakkı. %5 İş Sonu Komisyonu. Aynı anda en fazla 7 aktif iş (Kapasite Kilidi). Anlık Dağıtım ve Güvenilir Uzman Rozeti.' 
      },
    ];
  }

  /**
   * Kampanya Kodu Doğrulama (6 Kural Denetimi)
   */
  async validateCampaign(providerId: string, code: string, packageType: PackageType) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { code },
    });

    if (!campaign) {
      throw new NotFoundException('Geçersiz kampanya kodu.');
    }

    // 1. Kod aktif mi?
    if (!campaign.is_active) {
      throw new BadRequestException('Bu kampanya kodu şu an aktif değil.');
    }

    // 2. valid_until geçmemiş mi?
    const now = new Date();
    if (campaign.valid_until < now) {
      throw new BadRequestException('Bu kampanya kodunun süresi dolmuş.');
    }

    if (campaign.valid_from > now) {
      throw new BadRequestException('Bu kampanya kodu henüz geçerli değil.');
    }

    // 3. max_uses dolmamış mı?
    if (campaign.max_uses !== null && campaign.used_count >= campaign.max_uses) {
      throw new BadRequestException('Bu kampanya kodunun kullanım sınırı dolmuş.');
    }

    // 4. Bu HV daha önce kullandı mı? (tek kullanım)
    const priorUsage = await this.prisma.campaignUsage.findFirst({
      where: {
        provider_id: providerId,
        campaign_id: campaign.id,
      },
    });

    if (priorUsage) {
      throw new BadRequestException('Bu kampanya kodunu daha önce kullandınız.');
    }

    // 5. Seçilen paket için geçerli mi?
    if (
      campaign.applicable_packages &&
      campaign.applicable_packages.length > 0 &&
      !campaign.applicable_packages.includes(packageType)
    ) {
      throw new BadRequestException(`Bu kampanya kodu seçtiğiniz paket için geçerli değil. Geçerli paketler: ${campaign.applicable_packages.join(', ')}`);
    }

    // 6. new_users_only ise HV daha önce abone olmuş mu?
    if (campaign.new_users_only) {
      const priorSubscription = await this.prisma.subscription.findFirst({
        where: { provider_id: providerId },
      });

      if (priorSubscription) {
        throw new BadRequestException('Bu kampanya kodu yalnızca yeni üyeler için geçerlidir.');
      }
    }

    return campaign;
  }

  /**
   * Abonelik başlatma akışı
   */
  async startSubscription(providerUserId: string, dto: AbonelikBaslatDto) {
    // 1. Hizmet veren profilini al
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true },
    });

    if (!provider) {
      throw new ForbiddenException('Hizmet veren profiliniz bulunamadı.');
    }

    if (!provider.is_approved) {
      throw new ForbiddenException('Abonelik başlatabilmek için profilinizin onaylanmış olması gerekmektedir.');
    }

    // 2. VIP Paket kontrolü (Rating >= 4.5)
    if (dto.packageType === PackageType.vip) {
      const avgRating = provider.avg_rating ? Number(provider.avg_rating) : 0;
      if (avgRating < 4.5) {
        throw new BadRequestException('VIP pakete üye olabilmek için ortalama reytinginizin en az 4.5 olması gerekmektedir.');
      }
    }

    // 3. Fiyat tespiti
    const packages = await this.getPackages();
    const pkg = packages.find((p) => p.type === dto.packageType);
    if (!pkg) {
      throw new BadRequestException('Böyle bir paket bulunamadı.');
    }

    let finalPrice = pkg.price;
    let campaign: any = null;

    // 4. Kampanya uygulayışı
    if (dto.campaignCode) {
      campaign = await this.validateCampaign(provider.id, dto.campaignCode, dto.packageType);

      if (campaign.type === 'percent') {
        finalPrice = pkg.price * (1 - Number(campaign.value) / 100);
      } else if (campaign.type === 'fixed') {
        finalPrice = Math.max(0, pkg.price - Number(campaign.value));
      } else if (campaign.type === 'free_trial') {
        // Kart alınır, çekim yapılmaz -> X gün bedava deneme başlatılır (iyzico çağrılmadan)
        const trialDays = Number(campaign.value) || 14;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + trialDays);

        const subscription = await this.prisma.subscription.create({
          data: {
            provider_id: provider.id,
            package_type: dto.packageType,
            status: SubscriptionStatus.trial,
            started_at: new Date(),
            expires_at: expiresAt,
          },
        });

        // Aylık kota oluştur/güncelle
        const monthYear = new Date().toISOString().substring(0, 7);
        await this.prisma.providerMonthlyQuota.upsert({
          where: { provider_id_month_year: { provider_id: provider.id, month_year: monthYear } },
          create: {
            provider_id: provider.id,
            month_year: monthYear,
            accepted_count: 0,
            monthly_limit: pkg.quota,
            reset_at: expiresAt,
          },
          update: {
            monthly_limit: pkg.quota,
          },
        });

        // Kampanya kullanım kaydı at
        await this.prisma.campaignUsage.create({
          data: {
            campaign_id: campaign.id,
            provider_id: provider.id,
            subscription_id: subscription.id,
            discount_amount: pkg.price,
          },
        });

        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { used_count: { increment: 1 } },
        });

        return {
          success: true,
          message: `${trialDays} Günlük Ücretsiz Deneme paketiniz başarıyla tanımlandı.`,
          status: 'trial',
          expiresAt,
        };
      } else if (campaign.type === 'upgrade') {
        // Paket yükseltme: Basic fiyatına Premium/Standard gibi
        const basicPkg = packages.find((p) => p.type === PackageType.basic);
        finalPrice = basicPkg ? basicPkg.price : pkg.price;
      } else if (campaign.type === 'quota_bonus') {
        // Ek Kota Hediyesi: Ücret etkilenmez, kota limitine bonus eklenir.
        finalPrice = pkg.price;
      }
    }

    // 5. iyzico Checkout Formunu başlat
    const callbackUrl = `http://localhost:3005/api/webhooks/iyzico/callback?providerId=${provider.id}&packageType=${dto.packageType}&campaignId=${campaign ? campaign.id : ''}&discount=${pkg.price - finalPrice}`;
    const checkoutRes = await this.iyzicoService.createCheckoutForm(
      provider.id,
      dto.packageType,
      finalPrice,
      callbackUrl
    );

    return {
      success: true,
      message: 'Ödeme arayüzü hazırlandı.',
      token: checkoutRes.token,
      checkoutFormContent: checkoutRes.checkoutFormContent,
      paymentPageUrl: checkoutRes.paymentPageUrl,
    };
  }

  /**
   * Abonelik iptali akışı
   */
  async cancelSubscription(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { subscription: true },
    });

    if (!provider || !provider.subscription) {
      throw new NotFoundException('Aktif bir aboneliğiniz bulunmamaktadır.');
    }

    const sub = provider.subscription;

    if (sub.status === SubscriptionStatus.cancelled) {
      throw new BadRequestException('Aboneliğiniz zaten iptal edilmiş durumda.');
    }

    // iyzico iptali tetikle (varsa)
    if (sub.iyzico_subscription_ref) {
      await this.iyzicoService.cancelSubscription(sub.iyzico_subscription_ref);
    }

    // Durumu dönem sonuna kadar iptal edildi (cancelled) yap
    const updatedSub = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.cancelled,
        cancelled_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Aboneliğiniz iptal edildi. Mevcut dönem sonuna kadar faydalanmaya devam edebilirsiniz.',
      expiresAt: updatedSub.expires_at,
    };
  }

  /**
   * Abonelik detaylarını al
   */
  async getSubscriptionDetails(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: {
        subscription: {
          include: {
            payments: {
              orderBy: { created_at: 'desc' }
            }
          }
        }
      },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren bulunamadı.');
    }

    // Dynamic Capacity limits based on subscription package:
    let capacityLimit = 3; // default basic fallback
    if (provider.subscription && ['active', 'trial', 'admin_trial'].includes(provider.subscription.status)) {
      const pType = provider.subscription.package_type;
      if (pType === 'vip') {
        capacityLimit = 7;
      } else if (pType === 'standard' || pType === 'premium') {
        capacityLimit = 5;
      } else {
        capacityLimit = 3;
      }
    }

    // Calculate active capacity:
    const acceptedOffers = await this.prisma.acceptedOffer.findMany({
      where: {
        provider_id: provider.id,
        offer: {
          status: 'accepted',
        },
        job: {
          status: {
            notIn: ['completed', 'cancelled'],
          },
        },
      },
      include: {
        offer: true,
      },
    });

    const now = new Date();
    const activeJobsCount = acceptedOffers.filter((ao) => {
      // 1. If it has started (started_at is NOT null), it occupies slot.
      if (ao.offer.started_at) {
        return true;
      }
      // 2. If no appointment is set (immediate job), it occupies slot.
      if (!ao.offer.appointment_at) {
        return true;
      }
      // 3. If the appointment is less than 24 hours in the future, it occupies slot.
      const appointmentTime = new Date(ao.offer.appointment_at).getTime();
      const twentyFourHoursFromNow = now.getTime() + 24 * 60 * 60 * 1000;
      if (appointmentTime <= twentyFourHoursFromNow) {
        return true;
      }
      // Otherwise, it is a future appointment (> 24h away) and not started -> does not occupy slot.
      return false;
    }).length;

    const monthYear = new Date().toISOString().substring(0, 7);

    return {
      subscription: provider.subscription || null,
      quota: {
        accepted_count: activeJobsCount,
        monthly_limit: capacityLimit,
        month_year: monthYear,
      },
    };
  }

  /**
   * Webhook callback üzerinden aboneliği aktive et (Simüle veya Gerçek callback)
   */
  async handleCheckoutSuccess(providerId: string, packageType: PackageType, iyzicoSubRef: string, campaignId?: string, discountAmount: number = 0) {
    const pkgDetails = (await this.getPackages()).find((p) => p.type === packageType);
    let quotaLimit = pkgDetails ? pkgDetails.quota : 0;

    const startedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 aylık dönem

    const subscription = await this.prisma.$transaction(async (tx) => {
      // quota_bonus tipi kampanya var mı kontrol et ve kotayı arttır
      if (campaignId) {
        const campaign = await tx.campaign.findUnique({ where: { id: campaignId } });
        if (campaign && campaign.type === 'quota_bonus') {
          quotaLimit = quotaLimit ? quotaLimit + Number(campaign.value) : Number(campaign.value);
        }
      }

      // 1. Aboneliği oluştur veya güncelle
      const sub = await tx.subscription.upsert({
        where: { provider_id: providerId },
        create: {
          provider_id: providerId,
          package_type: packageType,
          status: SubscriptionStatus.active,
          started_at: startedAt,
          expires_at: expiresAt,
          iyzico_subscription_ref: iyzicoSubRef,
        },
        update: {
          package_type: packageType,
          status: SubscriptionStatus.active,
          started_at: startedAt,
          expires_at: expiresAt,
          iyzico_subscription_ref: iyzicoSubRef,
          cancelled_at: null, // iptal edilmişse geri aktif et
        },
      });

      // 2. Ödeme kaydı at
      const amount = pkgDetails ? pkgDetails.price - discountAmount : 0;
      await tx.payment.create({
        data: {
          subscription_id: sub.id,
          amount,
          status: PaymentStatus.success,
          iyzico_payment_id: `pay_${Date.now()}`,
          attempt_count: 1,
          paid_at: new Date(),
        },
      });

      // 3. Kampanya uygulandıysa tescille
      if (campaignId) {
        await tx.campaignUsage.create({
          data: {
            campaign_id: campaignId,
            provider_id: providerId,
            subscription_id: sub.id,
            discount_amount: discountAmount,
          },
        });

        await tx.campaign.update({
          where: { id: campaignId },
          data: { used_count: { increment: 1 } },
        });
      }

      // 4. Aylık kotaları güncelle
      const monthYear = startedAt.toISOString().substring(0, 7);
      await tx.providerMonthlyQuota.upsert({
        where: { provider_id_month_year: { provider_id: providerId, month_year: monthYear } },
        create: {
          provider_id: providerId,
          month_year: monthYear,
          accepted_count: 0,
          monthly_limit: quotaLimit,
          reset_at: expiresAt,
        },
        update: {
          monthly_limit: quotaLimit,
          reset_at: expiresAt,
        },
      });

      console.log(`[HV-07/Payment Success] Provider ${providerId} subscription active. Plan: ${packageType.toUpperCase()}`);
      return sub;
    });

    // 5. Referans ödüllendirme tetikleyici (ödeme başarılı olunca)
    await this.referralService.triggerProviderReward(providerId).catch((err) => {
      this.logger.error(`[Referral Reward Trigger Error] ${err.message}`, err.stack);
    });

    return subscription;
  }

  /**
   * Başarısız ödemeleri kuyruğa alıp askıya alma akışı
   */
  async handleFailedPayment(providerId: string, subscriptionId: string, attemptCount: number) {
    if (attemptCount === 1) {
      // 1. Başarısızlık: bildirim + 3 gün sonra retry
      console.log(`[HV-08 Notification] Payment failed for Provider ${providerId} (Attempt 1). Scheduling retry in 3 days.`);
      
      // BullMQ retry ekle
      await this.paymentQueue.add(
        'payment-retry-job',
        { providerId, subscriptionId, attemptCount: 2 },
        { delay: 3 * 24 * 60 * 60 * 1000 } // 3 gün gecikmeli (Mil saniye)
      );
    } else if (attemptCount === 2) {
      // 2. Başarısızlık: bildirim + 3 gün sonra retry
      console.log(`[HV-09 Notification] Payment failed for Provider ${providerId} (Attempt 2). Scheduling final retry in 3 days.`);
      
      await this.paymentQueue.add(
        'payment-retry-job',
        { providerId, subscriptionId, attemptCount: 3 },
        { delay: 3 * 24 * 60 * 60 * 1000 }
      );
    } else {
      // 3. Başarısızlık: suspended + bildirim
      console.log(`[HV-10 Notification] Payment failed for Provider ${providerId} (Attempt 3). Suspending subscription.`);
      
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.suspended },
      });
    }
  }

  /**
   * Admin Trial Atama Yetkisi
   */
  async adminGrantTrial(providerId: string, note?: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren bulunamadı.');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 günlük trial

    const updatedSub = await this.prisma.subscription.upsert({
      where: { provider_id: providerId },
      create: {
        provider_id: providerId,
        package_type: PackageType.standard, // Trial plan Standard olarak atanır
        status: SubscriptionStatus.admin_trial,
        started_at: new Date(),
        expires_at: expiresAt,
        admin_granted_by: '00000000-0000-0000-0000-000000000000',
        admin_trial_note: note || 'Admin tarafından atanan deneme süresi.',
      },
      update: {
        package_type: PackageType.standard,
        status: SubscriptionStatus.admin_trial,
        started_at: new Date(),
        expires_at: expiresAt,
        admin_granted_by: '00000000-0000-0000-0000-000000000000',
        admin_trial_note: note || 'Admin tarafından atanan deneme süresi.',
      },
    });

    // Aylık kota limitini güncelle
    const monthYear = new Date().toISOString().substring(0, 7);
    await this.prisma.providerMonthlyQuota.upsert({
      where: { provider_id_month_year: { provider_id: providerId, month_year: monthYear } },
      create: {
        provider_id: providerId,
        month_year: monthYear,
        accepted_count: 0,
        monthly_limit: 30, // Standart kota 30
        reset_at: expiresAt,
      },
      update: {
        monthly_limit: 30,
        reset_at: expiresAt,
      },
    });

    console.log(`[HV-19 Notification] Admin granted Standard trial package to Provider: ${providerId}`);

    return {
      success: true,
      message: 'Usta için 14 günlük deneme paketi başarıyla tanımlandı.',
      expiresAt,
    };
  }

  /**
   * Admin Trial İptal Yetkisi
   */
  async adminCancelTrial(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { subscription: true },
    });

    if (!provider || !provider.subscription) {
      throw new NotFoundException('Hizmet veren veya abonelik bulunamadı.');
    }

    if (provider.subscription.status !== SubscriptionStatus.admin_trial) {
      throw new BadRequestException('Bu hizmet verenin deneme süresi aktif değil.');
    }

    // Trial aboneliğini iptal et/sonlandır
    await this.prisma.subscription.update({
      where: { provider_id: providerId },
      data: {
        status: SubscriptionStatus.expired,
        expires_at: new Date(),
      },
    });

    // Aylık kotayı sıfırla/kapat
    const monthYear = new Date().toISOString().substring(0, 7);
    await this.prisma.providerMonthlyQuota.update({
      where: { provider_id_month_year: { provider_id: providerId, month_year: monthYear } },
      data: {
        monthly_limit: 0,
      },
    });

    console.log(`[HV-20 Notification] Admin cancelled trial package for Provider: ${providerId}`);

    return {
      success: true,
      message: 'Ustanın aktif deneme paketi başarıyla sonlandırıldı.',
    };
  }

  /**
   * Aylık Kota Sıfırlama Cron Görevi
   * Her ayın 1'inde saat 00:00 (Türkiye saati = UTC+3) tetiklenir.
   * Yani UTC saatiyle bir önceki gün 21:00. Cron: '0 21 1 * *'
   */
  @Cron('0 21 1 * *')
  async monthlyQuotaReset() {
    this.logger.log('--- RUNNING MONTHLY PROVIDER QUOTA RESET CRON ---');
    const monthYear = new Date().toISOString().substring(0, 7);
    const providers = await this.prisma.serviceProvider.findMany({
      include: { subscription: true },
    });

    let resetCount = 0;
    const now = new Date();

    for (const provider of providers) {
      let monthlyLimit = 0;
      
      // Abonelik durumunu kontrol et
      if (provider.subscription) {
        const sub = provider.subscription;
        // Abonelik aktif veya deneme süresi devam ediyorsa kota hakkı tanımla
        const isActiveOrTrial =
          [SubscriptionStatus.active, SubscriptionStatus.trial, SubscriptionStatus.admin_trial, SubscriptionStatus.cancelled].includes(sub.status as any) &&
          sub.expires_at > now;

        if (isActiveOrTrial) {
          const pkgDetails = (await this.getPackages()).find((p) => p.type === sub.package_type);
          monthlyLimit = pkgDetails ? (pkgDetails.quota ?? 999999) : 0; // null = vip sınırsız (999999 ile mock)
        }
      }

      await this.prisma.providerMonthlyQuota.upsert({
        where: { provider_id_month_year: { provider_id: provider.id, month_year: monthYear } },
        create: {
          provider_id: provider.id,
          month_year: monthYear,
          accepted_count: 0,
          monthly_limit: monthlyLimit === 999999 ? null : monthlyLimit,
          reset_at: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
        update: {
          accepted_count: 0,
          monthly_limit: monthlyLimit === 999999 ? null : monthlyLimit,
          reset_at: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      });

      resetCount++;
    }

    this.logger.log(`Successfully reset quotas for ${resetCount} providers for month ${monthYear}.`);
  }
}
