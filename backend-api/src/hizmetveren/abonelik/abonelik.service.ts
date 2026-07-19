import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { IyzicoService } from './iyzico.service';
import { AbonelikBaslatDto, AddCardDto } from './dto/abonelik.dto';
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
    const dbConfigs = await this.prisma.systemPackageConfig.findMany();
    
    const getConfig = (type: string, defPrice: number, defComm: number, defLimit: number, defDelay: number) => {
      const found = dbConfigs.find(c => c.package_type === type);
      return {
        price: found ? Number(found.price) : defPrice,
        commissionRate: found ? Number(found.commission_rate) : defComm,
        activeJobsLimit: found ? found.active_jobs_limit : defLimit,
        delayMinutes: found ? found.delay_minutes : defDelay,
      };
    };

    const freeCfg = getConfig('free', 0, 10, 1, 15);
    const basicCfg = getConfig('basic', 5000, 7, 3, 10);
    const standardCfg = getConfig('standard', 10000, 5, 5, 5);
    const vipCfg = getConfig('vip', 20000, 3, 7, 0);

    return [
      { 
        type: 'free', 
        price: freeCfg.price, 
        quota: null, 
        commissionRate: freeCfg.commissionRate,
        activeJobsLimit: freeCfg.activeJobsLimit,
        delayMinutes: freeCfg.delayMinutes,
        name: 'Ücretsiz Paket (Freemium)', 
        description: `Aylık 0 ₺ | Komisyon: %${freeCfg.commissionRate} | Gecikme: ${freeCfg.delayMinutes} Dk | Aktif İş Limiti (Kapasite): ${freeCfg.activeJobsLimit} | Rozet: Yok` 
      },
      { 
        type: PackageType.basic, 
        price: basicCfg.price, 
        quota: null, 
        commissionRate: basicCfg.commissionRate,
        activeJobsLimit: basicCfg.activeJobsLimit,
        delayMinutes: basicCfg.delayMinutes,
        name: 'Basic Paket (Düşük)', 
        description: `Aylık ${basicCfg.price.toLocaleString('tr-TR')} ₺ | Komisyon: %${basicCfg.commissionRate} | Gecikme: ${basicCfg.delayMinutes} Dk | Aktif İş Limiti (Kapasite): ${basicCfg.activeJobsLimit} | Rozet: VIP / Onaylı Üye ✔️` 
      },
      { 
        type: PackageType.standard, 
        price: standardCfg.price, 
        quota: null, 
        commissionRate: standardCfg.commissionRate,
        activeJobsLimit: standardCfg.activeJobsLimit,
        delayMinutes: standardCfg.delayMinutes,
        name: 'Standart Paket (Orta)', 
        description: `Aylık ${standardCfg.price.toLocaleString('tr-TR')} ₺ | Komisyon: %${standardCfg.commissionRate} | Gecikme: ${standardCfg.delayMinutes} Dk | Aktif İş Limiti (Kapasite): ${standardCfg.activeJobsLimit} | Rozet: VIP / Onaylı Üye ✔️` 
      },
      { 
        type: PackageType.vip, 
        price: vipCfg.price, 
        quota: null, 
        commissionRate: vipCfg.commissionRate,
        activeJobsLimit: vipCfg.activeJobsLimit,
        delayMinutes: vipCfg.delayMinutes,
        name: 'VIP Paket (Yüksek)', 
        description: `Aylık ${vipCfg.price.toLocaleString('tr-TR')} ₺ | Komisyon: %${vipCfg.commissionRate} | Gecikme: ${vipCfg.delayMinutes} Dk | Aktif İş Limiti (Kapasite): ${vipCfg.activeJobsLimit} | Rozet: VIP / Onaylı Üye ✔️` 
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

    // 5. Birincil kayıtlı kartı var mı? Varsa doğrudan karttan çekerek hemen aktifleştirebiliriz!
    const primaryCard = await this.prisma.savedCard.findFirst({
      where: { provider_id: provider.id, is_primary: true },
    });

    if (primaryCard && finalPrice > 0) {
      try {
        const chargeRes = await this.iyzicoService.chargeCard(
          provider.id,
          primaryCard.card_user_key,
          primaryCard.card_token,
          finalPrice,
          'subscription'
        );

        if (chargeRes.status === 'success') {
          // Aboneliği doğrudan aktif et
          const subscription = await this.prisma.subscription.upsert({
            where: { provider_id: provider.id },
            create: {
              provider_id: provider.id,
              package_type: dto.packageType,
              status: SubscriptionStatus.active,
              started_at: new Date(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            update: {
              package_type: dto.packageType,
              status: SubscriptionStatus.active,
              started_at: new Date(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          });

          // Ödeme kaydı
          await this.prisma.payment.create({
            data: {
              subscription_id: subscription.id,
              amount: finalPrice,
              status: PaymentStatus.success,
              iyzico_payment_id: chargeRes.paymentId,
              attempt_count: 1,
              paid_at: new Date(),
            }
          });

          // Kotasını yenile
          const monthYear = new Date().toISOString().substring(0, 7);
          await this.prisma.providerMonthlyQuota.upsert({
            where: { provider_id_month_year: { provider_id: provider.id, month_year: monthYear } },
            create: {
              provider_id: provider.id,
              month_year: monthYear,
              accepted_count: 0,
              monthly_limit: pkg.quota,
              reset_at: subscription.expires_at,
            },
            update: {
              monthly_limit: pkg.quota,
            },
          });

          // Kampanya kullanımı kaydet
          if (campaign) {
            await this.prisma.campaignUsage.create({
              data: {
                campaign_id: campaign.id,
                provider_id: provider.id,
                subscription_id: subscription.id,
                discount_amount: pkg.price - finalPrice,
              },
            });
            await this.prisma.campaign.update({
              where: { id: campaign.id },
              data: { used_count: { increment: 1 } },
            });
          }

          return {
            success: true,
            status: 'active',
            message: `${pkg.name} aboneliğiniz kayıtlı kartınızdan tahsil edilerek başarıyla aktifleştirildi.`,
          };
        }
      } catch (err) {
        this.logger.error(`Direct saved card payment failed for provider ${provider.id}: ${err.message}. Falling back to Checkout Form.`);
      }
    }

    // 6. iyzico Checkout Formunu başlat
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
    let capacityLimit = 1; // default free fallback
    if (provider.subscription && ['active', 'trial', 'admin_trial'].includes(provider.subscription.status)) {
      const pType = provider.subscription.package_type;
      if (pType === 'vip') {
        capacityLimit = 7;
      } else if (pType === 'standard' || pType === 'premium') {
        capacityLimit = 5;
      } else if (pType === 'basic') {
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

    // Calculate unpaid commission:
    // Find all completed job completions for this provider where offer.commission_paid is false
    const unpaidCompletions = await this.prisma.jobCompletion.findMany({
      where: {
        provider_id: provider.id,
        status: 'completed',
        offer: {
          commission_paid: false,
        },
      },
      include: {
        offer: true,
      },
    });

    let totalUnpaidCommission = 0;
    for (const c of unpaidCompletions) {
      const price = c.provider_declared_amount ? Number(c.provider_declared_amount) : Number(c.offer.price);
      const rate = c.offer.commission_rate ? Number(c.offer.commission_rate) : 0;
      totalUnpaidCommission += (price * rate) / 100;
    }

    // Next billing date is the 1st of the next month
    const currentDate = new Date();
    const nextBillingDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

    const monthYear = new Date().toISOString().substring(0, 7);

    return {
      subscription: provider.subscription || null,
      quota: {
        accepted_count: activeJobsCount,
        monthly_limit: capacityLimit,
        month_year: monthYear,
      },
      unpaidCommission: totalUnpaidCommission,
      nextBillingDate: nextBillingDate.toISOString(),
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

  /**
   * Kartları Listele (Hizmet Veren)
   */
  async getSavedCards(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: userId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    return this.prisma.savedCard.findMany({
      where: { provider_id: provider.id },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        card_holder: true,
        card_brand: true,
        card_association: true,
        card_family: true,
        bin_number: true,
        last_four: true,
        is_primary: true,
        created_at: true,
      }
    });
  }

  /**
   * Kart Ekle (Hizmet Veren)
   */
  async addSavedCard(userId: string, dto: AddCardDto) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: userId },
      include: { user: true },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    // iyzico Card Storage'a kaydet
    const iyzicoRes = await this.iyzicoService.saveCard(
      provider.id,
      provider.user.email || 'partner@esnaaf.com',
      dto
    );

    // Daha önce kart var mı? Yoksa bu kartı primary yapacağız
    const existingCardsCount = await this.prisma.savedCard.count({
      where: { provider_id: provider.id },
    });
    const isPrimary = existingCardsCount === 0;

    // Eğer bu kart primary ise ve daha önce kartlar varsa, diğerlerinin primary durumunu kaldır
    if (isPrimary) {
      await this.prisma.savedCard.updateMany({
        where: { provider_id: provider.id },
        data: { is_primary: false },
      });
    }

    const savedCard = await this.prisma.savedCard.create({
      data: {
        provider_id: provider.id,
        card_holder: dto.cardHolderName,
        card_brand: iyzicoRes.cardBrand,
        card_association: iyzicoRes.cardAssociation,
        card_family: iyzicoRes.cardFamily,
        card_user_key: iyzicoRes.cardUserKey,
        card_token: iyzicoRes.cardToken,
        bin_number: iyzicoRes.binNumber,
        last_four: iyzicoRes.lastFour,
        is_primary: isPrimary,
      },
    });

    return {
      success: true,
      message: 'Kartınız başarıyla kaydedildi.',
      card: savedCard,
    };
  }

  /**
   * Kart Sil (Hizmet Veren)
   */
  async deleteSavedCard(userId: string, cardId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: userId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const card = await this.prisma.savedCard.findUnique({
      where: { id: cardId },
    });
    if (!card || card.provider_id !== provider.id) {
      throw new NotFoundException('Kart bulunamadı.');
    }

    // iyzico'dan sil
    await this.iyzicoService.deleteCard(provider.id, card.card_user_key, card.card_token);

    // Veritabanından sil
    await this.prisma.savedCard.delete({
      where: { id: cardId },
    });

    // Eğer silinen kart primary ise ve başka kartlar varsa, en yeni kartı primary yap
    if (card.is_primary) {
      const remainingCard = await this.prisma.savedCard.findFirst({
        where: { provider_id: provider.id },
        orderBy: { created_at: 'desc' },
      });
      if (remainingCard) {
        await this.prisma.savedCard.update({
          where: { id: remainingCard.id },
          data: { is_primary: true },
        });
      }
    }

    return {
      success: true,
      message: 'Kartınız başarıyla silindi.',
    };
  }

  /**
   * Birincil Kart Yap (Hizmet Veren)
   */
  async setPrimaryCard(userId: string, cardId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: userId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const card = await this.prisma.savedCard.findUnique({
      where: { id: cardId },
    });
    if (!card || card.provider_id !== provider.id) {
      throw new NotFoundException('Kart bulunamadı.');
    }

    // Diğerlerini pasif et
    await this.prisma.savedCard.updateMany({
      where: { provider_id: provider.id },
      data: { is_primary: false },
    });

    // Seçileni aktif et
    const updated = await this.prisma.savedCard.update({
      where: { id: cardId },
      data: { is_primary: true },
    });

    return {
      success: true,
      message: 'Varsayılan ödeme kartınız güncellendi.',
      card: updated,
    };
  }

  /**
   * Haftalık Komisyon Otomatik Tahsilat Cron Görevi
   * Her Pazar günü saat 21:00 UTC (Türkiye saatiyle Pazartesi 00:00) çalışır.
   */
  @Cron('0 21 * * 0')
  async weeklyCommissionBilling() {
    this.logger.log('--- STARTING WEEKLY COMMISSION AUTO-BILLING CRON ---');
    const providers = await this.prisma.serviceProvider.findMany({
      include: {
        user: true,
      },
    });

    let successCount = 0;
    let failCount = 0;

    for (const provider of providers) {
      try {
        // Ustanın ödenmemiş komisyon borçlarını hesapla
        const unpaidCompletions = await this.prisma.jobCompletion.findMany({
          where: {
            provider_id: provider.id,
            status: 'completed',
            offer: {
              commission_paid: false,
            },
          },
          include: {
            offer: {
              include: {
                job: true
              }
            },
          },
        });

        if (unpaidCompletions.length === 0) continue;

        let totalUnpaidCommission = 0;
        for (const c of unpaidCompletions) {
          const price = c.provider_declared_amount ? Number(c.provider_declared_amount) : Number(c.offer.price);
          const rate = c.offer.commission_rate ? Number(c.offer.commission_rate) : 0;
          totalUnpaidCommission += (price * rate) / 100;
        }

        if (totalUnpaidCommission <= 0) continue;

        // Ustanın birincil ödeme kartını bul
        const primaryCard = await this.prisma.savedCard.findFirst({
          where: { provider_id: provider.id, is_primary: true },
        });

        if (!primaryCard) {
          this.logger.warn(`No primary card found for Provider: ${provider.id}. Commission of ₺${totalUnpaidCommission} could not be billed.`);
          // HV-71: Ödeme Hatası / Kart Yok Bildirimi Logla
          await this.prisma.notificationLog.create({
            data: {
              user_id: provider.user_id,
              event_code: 'HV-71',
              channel: 'in_app',
              status: 'sent',
              payload: {
                title: 'Haftalık Komisyon Tahsilat Hatası',
                body: `Birikmiş ₺${totalUnpaidCommission.toFixed(2)} komisyon borcunuz, sistemde kayıtlı kart bulunamadığından tahsil edilemedi. Lütfen bir kart kaydediniz.`,
                level: 'yellow',
              },
              sent_at: new Date(),
              delivered_at: new Date(),
            }
          });
          failCount++;
          continue;
        }

        // Karttan çekim yap
        const chargeRes = await this.iyzicoService.chargeCard(
          provider.id,
          primaryCard.card_user_key,
          primaryCard.card_token,
          totalUnpaidCommission,
          'commission'
        );

        if (chargeRes.status === 'success') {
          // Komisyonları ödendi olarak işaretle
          const offerIds = unpaidCompletions.map(c => c.offer.id);
          await this.prisma.offer.updateMany({
            where: { id: { in: offerIds } },
            data: { commission_paid: true },
          });

          // Abone tablosundan aktif bir abonelik varsa ilişkili payment at
          const activeSub = await this.prisma.subscription.findUnique({
            where: { provider_id: provider.id },
          });

          if (activeSub) {
            await this.prisma.payment.create({
              data: {
                subscription_id: activeSub.id,
                amount: totalUnpaidCommission,
                status: PaymentStatus.success,
                iyzico_payment_id: chargeRes.paymentId,
                attempt_count: 1,
                paid_at: new Date(),
              }
            });
          }

          // HV-70: Ödeme Başarılı Bildirimi
          await this.prisma.notificationLog.create({
            data: {
              user_id: provider.user_id,
              event_code: 'HV-70',
              channel: 'in_app',
              status: 'sent',
              payload: {
                title: 'Komisyon Tahsilatı Başarılı',
                body: `Haftalık birikmiş ₺${totalUnpaidCommission.toFixed(2)} komisyon tutarı kayıtlı kartınızdan başarıyla tahsil edilmiştir.`,
                level: 'info',
              },
              sent_at: new Date(),
              delivered_at: new Date(),
            }
          });

          successCount++;
        }
      } catch (err) {
        this.logger.error(`Weekly commission billing failed for provider ${provider.id}: ${err.message}`);
        // HV-72: Tahsilat Hatası Bildirimi
        await this.prisma.notificationLog.create({
          data: {
            user_id: provider.user_id,
            event_code: 'HV-72',
            channel: 'in_app',
            status: 'sent',
            payload: {
              title: 'Haftalık Komisyon Tahsilat Hatası',
              body: `Birikmiş komisyon borcunuz kayıtlı kartınızdan tahsil edilirken hata oluştu: ${err.message}. Lütfen kartınızı güncelleyin.`,
              level: 'red',
            },
            sent_at: new Date(),
            delivered_at: new Date(),
          }
        });
        failCount++;
      }
    }

    this.logger.log(`Weekly Commission billing job finished. Success: ${successCount}, Failures: ${failCount}`);
  }

  /**
   * Birikmiş Komisyonları Manuel Öde (Hizmet Veren)
   */
  async payCommissionManually(userId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: userId },
      include: { user: true },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const unpaidCompletions = await this.prisma.jobCompletion.findMany({
      where: {
        provider_id: provider.id,
        status: 'completed',
        offer: {
          commission_paid: false,
        },
      },
      include: {
        offer: true,
      },
    });

    if (unpaidCompletions.length === 0) {
      throw new BadRequestException('Ödenmemiş komisyon borcunuz bulunmamaktadır.');
    }

    let totalUnpaidCommission = 0;
    for (const c of unpaidCompletions) {
      const price = c.provider_declared_amount ? Number(c.provider_declared_amount) : Number(c.offer.price);
      const rate = c.offer.commission_rate ? Number(c.offer.commission_rate) : 0;
      totalUnpaidCommission += (price * rate) / 100;
    }

    if (totalUnpaidCommission <= 0) {
      throw new BadRequestException('Ödenecek komisyon tutarı sıfırdır.');
    }

    const primaryCard = await this.prisma.savedCard.findFirst({
      where: { provider_id: provider.id, is_primary: true },
    });

    if (!primaryCard) {
      throw new BadRequestException('Kayıtlı bir ödeme kartı bulunamadı. Lütfen önce kart ekleyin.');
    }

    // Karttan çekim yap
    const chargeRes = await this.iyzicoService.chargeCard(
      provider.id,
      primaryCard.card_user_key,
      primaryCard.card_token,
      totalUnpaidCommission,
      'commission'
    );

    if (chargeRes.status === 'success') {
      const offerIds = unpaidCompletions.map(c => c.offer.id);
      await this.prisma.offer.updateMany({
        where: { id: { in: offerIds } },
        data: { commission_paid: true },
      });

      const activeSub = await this.prisma.subscription.findUnique({
        where: { provider_id: provider.id },
      });

      if (activeSub) {
        await this.prisma.payment.create({
          data: {
            subscription_id: activeSub.id,
            amount: totalUnpaidCommission,
            status: PaymentStatus.success,
            iyzico_payment_id: chargeRes.paymentId,
            attempt_count: 1,
            paid_at: new Date(),
          }
        });
      }

      return {
        success: true,
        message: `₺${totalUnpaidCommission.toFixed(2)} tutarındaki birikmiş komisyon borcunuz başarıyla tahsil edilmiştir.`,
      };
    } else {
      throw new BadRequestException('Ödeme tahsil edilemedi.');
    }
  }
}
