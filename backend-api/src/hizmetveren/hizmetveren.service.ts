import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChatGateway } from '../ortak/chat/chat.gateway';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDocumentsDto } from './dto/update-documents.dto';
import { decryptPhone } from '../common/utils/phone.util';
import { BildirimService } from '../ortak/bildirimler/bildirim.service';
import { RedisService } from '../common/redis/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../ortak/auth/auth.service';

@Injectable()
export class HizmetverenService {
  private readonly logger = new Logger(HizmetverenService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private bildirimService: BildirimService,
    private redis: RedisService,
    private authService: AuthService,
  ) {}

  /**
   * Hizmet veren için atanmış/dağıtılmış ve henüz teklif verilmemiş aktif işleri listeler (viewer sayısı ile)
   */
  async getGelenIsler(providerUserId: string) {
    // 1. Hizmet veren kaydını bul
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const quota = await this.getQuotaStatus(providerUserId);
    const isLocked = quota.used >= quota.limit;
    if (isLocked) {
      return [];
    }

    // 2. Bu ustaya dağıtılmış response_time kayıtlarını al
    const responseTimes = await this.prisma.responseTime.findMany({
      where: { 
        provider_id: provider.id,
        notified_at: {
          lte: new Date(),
        },
      },
      orderBy: { notified_at: 'desc' },
    });

    const gelenIsler: any[] = [];

    for (const rt of responseTimes) {
      // İş detaylarını çek
      const job = await this.prisma.serviceRequest.findUnique({
        where: { id: rt.job_id },
        include: {
          category: true,
          offers: {
            where: { provider_id: provider.id },
          },
        },
      });

      // Eğer iş silindiyse, iptal edildiyse, tamamlandıysa veya usta zaten teklif verdiyse es geç
      if (!job || job.status === 'completed' || job.status === 'cancelled') {
        continue;
      }

      if (rt.is_rejected) {
        continue;
      }

      if (job.offers.length > 0) {
        // Zaten teklif verilmiş
        continue;
      }

      const acceptedOffer = await this.prisma.offer.findFirst({
        where: {
          job_id: job.id,
          status: 'accepted',
        },
      });
      if (acceptedOffer) {
        continue;
      }

      // 30 dk zaman sayacı ve 4 teklif sınırı kontrolü
      const jobOffers = await this.prisma.offer.findMany({
        where: { job_id: job.id },
        select: { created_at: true },
      });
      const offersCount = jobOffers.length;

      const { isExpired, expiresTime } = getRequestExpiryInfo(job.created_at, Date.now(), jobOffers);

      if (offersCount >= 4 || isExpired) {
        continue; // teklif dolduysa veya zaman aşımına uğradıysa gelen kutusundan kaldır
      }

      // 3. Bu işin toplam kaç ustaya dağıtıldığını say (viewer sayısı)
      const viewerCount = await this.prisma.responseTime.count({
        where: { job_id: job.id },
      });

      const formData = job.form_data as any;

      gelenIsler.push({
        id: job.id,
        categoryName: job.category.name,
        district: formData.district || 'Kadıköy',
        details: formData.details || '',
        name: formData.name || 'Müşteri',
        created_at: job.created_at,
        viewerCount,
        butce: formData.butce || null,
        aciliyet: formData.aciliyet || null,
        offersCount,
        expiresTime,
      });
    }

    return gelenIsler;
  }

  /**
   * Hizmet verenin mevcut ay içindeki kabul edilmiş tekliflerini (kota durumunu) döndürür
   */
  async getQuotaStatus(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true, subscription: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    // Dynamic Capacity limits based on subscription package:
    let capacityLimit = 1; // default free fallback
    let packageName = 'Ücretsiz (Freemium)';

    if (provider.subscription && ['active', 'trial', 'admin_trial'].includes(provider.subscription.status)) {
      const pType = provider.subscription.package_type;
      if (pType === 'vip') {
        capacityLimit = 7;
        packageName = 'VIP Paket (Yüksek)';
      } else if (pType === 'standard' || pType === 'premium') {
        capacityLimit = 5;
        packageName = 'Standart Paket (Orta)';
      } else if (pType === 'basic') {
        capacityLimit = 3;
        packageName = 'Basic Paket (Düşük)';
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

    const remaining = Math.max(0, capacityLimit - activeJobsCount);

    return {
      providerId: provider.id,
      providerName: provider.user.name || 'Hizmet Veren',
      packageName,
      used: activeJobsCount,
      limit: capacityLimit,
      remaining,
    };
  }

  /**
   * Hizmet verenin bir talebe teklif vermesini sağlar
   */
  async createOffer(providerUserId: string, dto: CreateOfferDto) {
    // 1. Hizmet veren kontrolü
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true, subscription: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    if (!provider.is_approved) {
      throw new ForbiddenException('Hizmet veren hesabınız henüz onaylanmamıştır.');
    }

    // 2. Kapasite (Kota) kontrolü
    const quota = await this.getQuotaStatus(providerUserId);
    if (quota.remaining !== null && quota.remaining <= 0) {
      throw new BadRequestException('Aktif iş kapasite limitiniz dolmuştur. Yeni teklif verebilmek için aktif işlerinizi tamamlamalı veya paketinizi yükseltmelisiniz.');
    }

    // 3. Talebin varlık ve durum kontrolü
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: dto.jobId },
      include: { category: true },
    });

    if (!job) {
      throw new NotFoundException('İlgili talep bulunamadı.');
    }

    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new BadRequestException('Tamamlanmış veya iptal edilmiş bir talebe teklif veremezsiniz.');
    }

    // 3b. Zaman ve Teklif Sınırı Koruması (Rezervasyon dahil)
    const jobOffers = await this.prisma.offer.findMany({
      where: { job_id: dto.jobId },
      select: { created_at: true },
    });
    const offerCount = jobOffers.length;

    if (offerCount >= 4) {
      throw new BadRequestException('Bu talep maksimum teklif sınırına (4 teklif) ulaşmış ve teklif girişine kapanmıştır.');
    }

    const { isExpired, label } = getRequestExpiryInfo(job.created_at, Date.now(), jobOffers);
    if (isExpired) {
      throw new BadRequestException(`Bu talebin ${label} süresi dolmuş ve teklif girişine kapanmıştır.`);
    }



    // 4. Bu ustaya dağıtılmış mı kontrolü
    const rt = await this.prisma.responseTime.findFirst({
      where: { provider_id: provider.id, job_id: dto.jobId },
    });

    if (!rt) {
      throw new ForbiddenException('Bu iş için size yapılmış bir dağıtım bulunmamaktadır.');
    }

    // 5. Mükerrer teklif kontrolü
    const existingOffer = await this.prisma.offer.findUnique({
      where: {
        job_id_provider_id: {
          job_id: dto.jobId,
          provider_id: provider.id,
        },
      },
    });

    if (existingOffer) {
      throw new BadRequestException('Bu talebe zaten daha önce teklif verdiniz.');
    }

    // 6. Teklifi oluştur ve Response Time kaydet (Transaction içinde)
    const result = await this.prisma.$transaction(async (tx) => {
      const newOffer = await tx.offer.create({
        data: {
          job_id: dto.jobId,
          provider_id: provider.id,
          price: dto.price,
          message: dto.message,
          status: 'pending',
        },
      });

      // Response Time kaydet
      const now = new Date();
      const durationMs = now.getTime() - rt.notified_at.getTime();
      const durationMin = Math.round(durationMs / (1000 * 60));

      await tx.responseTime.update({
        where: { id: rt.id },
        data: {
          responded_at: now,
          response_duration_minutes: durationMin,
        },
      });

      return newOffer;
    });

    // 7. WebSocket ile müşteriyi bilgilendir
    this.chatGateway.emitNewOffer(dto.jobId, {
      id: result.id,
      price: Number(result.price),
      description: result.message || '',
      created_at: result.created_at,
      providerId: provider.id,
      providerName: provider.user.name || 'Hizmet Veren',
      providerRating: provider.avg_rating ? Number(provider.avg_rating) : 4.0,
      providerIsApproved: provider.is_approved,
      providerSubscription: provider.subscription ? {
        status: provider.subscription.status,
        package_type: provider.subscription.package_type,
      } : null,
    });

    this.logger.log(`[Teklif Verildi] Usta ${provider.user.name} tarafından Talep ${dto.jobId}'ye ${dto.price} TL teklif verildi.`);

    // Send push notification to the customer (Seeker)
    try {
      const offerCount = await this.prisma.offer.count({
        where: { job_id: dto.jobId },
      });
      // The current offer is already saved in database, so count will be >= 1.
      if (offerCount <= 1) {
        await this.bildirimService.sendNotification(job.seeker_id, 'HA-02', { jobId: job.id });
      } else {
        await this.bildirimService.sendNotification(job.seeker_id, 'HA-03', { count: offerCount, jobId: job.id });
      }
    } catch (notifErr) {
      this.logger.error(`Failed to send offer notification to customer: ${notifErr.message}`);
    }

    return {
      success: true,
      message: 'Teklifiniz başarıyla iletildi.',
      offer: result,
    };
  }

  /**
   * Gelen işi reddetme (iptal etme) işlemi
   */
  async rejectJob(providerUserId: string, jobId: string, reason: string, details?: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    // Find the ResponseTime record representing the job opportunity
    const responseTime = await this.prisma.responseTime.findFirst({
      where: {
        provider_id: provider.id,
        job_id: jobId,
      },
    });

    if (!responseTime) {
      throw new NotFoundException('Bu iş için size gönderilmiş bir fırsat bulunamadı.');
    }

    if (responseTime.is_rejected) {
      throw new BadRequestException('Bu iş fırsatını zaten reddettiniz.');
    }

    await this.prisma.responseTime.update({
      where: { id: responseTime.id },
      data: {
        is_rejected: true,
        rejection_reason: reason,
        rejection_details: details,
        responded_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'İş fırsatı başarıyla reddedildi.',
    };
  }

  /**
   * Hesaplar ve usta sağlık skorunu döndürür (0-100 Puan)
   */
  async calculateProviderHealthScore(providerId: string, provider: any): Promise<number> {
    // 1. Ortalama NPS Puanı (%40 ağırlık)
    const npsAggregate = await this.prisma.npsResponse.aggregate({
      where: { provider_id: providerId },
      _avg: { score: true },
    });
    const avgNps = npsAggregate._avg.score !== null ? Number(npsAggregate._avg.score) : 8.0; // varsayılan 8.0
    const npsScoreNormalized = avgNps * 10; // 0-10 -> 0-100

    // 2. Uyuşmazlık Geçmişi (%20 ağırlık)
    const disputeCount = await this.prisma.jobCompletion.count({
      where: { provider_id: providerId, status: 'disputed' },
    });
    const disputeScore = Math.max(0, 100 - (disputeCount * 25)); // her uyuşmazlık için -25

    // 3. Yanıt Verme Hızı (%20 ağırlık)
    const speedAvg = provider.response_time_avg || 30; // varsayılan 30 dk
    let speedScore = 20;
    if (speedAvg < 10) speedScore = 100;
    else if (speedAvg <= 30) speedScore = 80;
    else if (speedAvg <= 60) speedScore = 50;
    
    // 4. Tamamlanan İş Sayısı (%20 ağırlık)
    const totalJobs = provider.total_jobs || 0;
    let jobsScore = 50;
    if (totalJobs >= 15) jobsScore = 100;
    else if (totalJobs >= 5) jobsScore = 90;
    else if (totalJobs >= 1) jobsScore = 75;

    const healthScore =
      npsScoreNormalized * 0.4 +
      disputeScore * 0.2 +
      speedScore * 0.2 +
      jobsScore * 0.2;

    return Math.round(healthScore);
  }

  /**
   * Hizmet verenin profil detaylarını döner
   */
  async getProfile(providerUserId: string) {
    const cacheKey = `provider:profile:v2:${providerUserId}`;
    return this.redis.getOrSet(cacheKey, async () => {
      const provider = await this.prisma.serviceProvider.findUnique({
        where: { user_id: providerUserId },
        include: { user: true },
      });

      if (!provider) {
        throw new NotFoundException('Hizmet veren profili bulunamadı.');
      }

      let onboardingData: any = {};
      let bioStr = '';
      if (provider.description) {
        if (provider.description.startsWith('{')) {
          try {
            onboardingData = JSON.parse(provider.description);
            bioStr = onboardingData.bio || '';
          } catch (e) {
            bioStr = provider.description;
          }
        } else {
          bioStr = provider.description;
        }
      }

      const healthScore = await this.calculateProviderHealthScore(provider.id, provider);

      return {
        id: provider.id,
        userId: provider.user_id,
        name: provider.user.name || 'Hizmet Veren',
        phone_masked: provider.user.phone_masked,
        city: provider.city || 'Adana',
        serviceDistricts: provider.service_districts || [],
        isApproved: provider.is_approved,
        accountStatus: provider.account_status,
        identityDocument: onboardingData.identityDocument || '',
        taxPlateDocument: onboardingData.taxPlateDocument || '',
        companyType: onboardingData.companyType || '',
        companyName: onboardingData.companyName || '',
        bio: bioStr,
        healthScore,
        esnaaf_id: provider.user.esnaaf_id,
      };
    }, 600); // Cache for 10 minutes
  }

  /**
   * Hizmet verenin yüklediği kimlik ve vergi levhasını günceller
   */
  async updateDocuments(providerUserId: string, dto: UpdateDocumentsDto) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    let descriptionObj: any = {};
    try {
      if (provider.description && provider.description.startsWith('{')) {
        descriptionObj = JSON.parse(provider.description);
      }
    } catch (e) {
      // fallback
    }

    if (dto.identityDocument !== undefined) {
      descriptionObj.identityDocument = dto.identityDocument;
    }
    if (dto.taxPlateDocument !== undefined) {
      descriptionObj.taxPlateDocument = dto.taxPlateDocument;
    }

    await this.prisma.serviceProvider.update({
      where: { id: provider.id },
      data: {
        description: JSON.stringify(descriptionObj),
      },
    });

    await this.redis.del(`provider:profile:v2:${providerUserId}`);

    return {
      success: true,
      message: 'Belgeleriniz başarıyla güncellendi.',
      identityDocument: descriptionObj.identityDocument || '',
      taxPlateDocument: descriptionObj.taxPlateDocument || '',
    };
  }

  /**
   * Hizmet verenin profil konum bilgilerini günceller
   */
  async updateProfile(providerUserId: string, dto: UpdateProfileDto) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    let descriptionObj: any = {};
    if (provider.description) {
      if (provider.description.startsWith('{')) {
        try {
          descriptionObj = JSON.parse(provider.description);
        } catch (e) {
          descriptionObj = { bio: provider.description };
        }
      } else {
        descriptionObj = { bio: provider.description };
      }
    }

    if (dto.description !== undefined) {
      descriptionObj.bio = dto.description;
    }

    const updated = await this.prisma.serviceProvider.update({
      where: { id: provider.id },
      data: {
        city: dto.city,
        service_districts: dto.serviceDistricts,
        description: JSON.stringify(descriptionObj),
      },
    });

    if (dto.name !== undefined) {
      await this.prisma.user.update({
        where: { id: providerUserId },
        data: { name: dto.name },
      });
    }

    await this.redis.del(`provider:profile:v2:${providerUserId}`);

    const freshProfile = await this.getProfile(providerUserId);

    return {
      success: true,
      message: 'Profil bilgileriniz başarıyla güncellendi.',
      provider: freshProfile,
    };
  }

  /**
   * Ustanın reytingine göre dynamic paket sınırlarını döner
   */
  private getProviderPackage(rating: number): { type: string; limit: number } {
    if (rating >= 4.7) {
      return { type: 'vip', limit: Infinity };
    } else if (rating >= 4.3) {
      return { type: 'premium', limit: 60 };
    } else if (rating >= 3.8) {
      return { type: 'standart', limit: 30 };
    } else {
      return { type: 'basic', limit: 14 };
    }
  }

  /**
   * Hizmet verenin vermiş olduğu tüm teklifleri ve ilgili talepleri getirir
   */
  async getOffers(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const offers = await this.prisma.offer.findMany({
      where: { 
        provider_id: provider.id,
        status: 'pending',
        job: {
          status: { notIn: ['completed', 'cancelled'] },
          offers: {
            none: {
              status: 'accepted',
            },
          },
        },
      },
      include: {
        job: {
          include: {
            category: true,
            offers: {
              select: {
                created_at: true,
              },
            },
          },
        },
        messages: {
          where: {
            sender_id: { not: providerUserId },
          },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const activeOffers = offers.filter((o) => {
      const { isExpired } = getRequestExpiryInfo(o.job.created_at, Date.now(), o.job.offers);
      return !isExpired;
    });

    return activeOffers.map((o) => {
      const formData = o.job.form_data as any;
      return {
        id: o.id,
        price: Number(o.price),
        message: o.message,
        status: o.status,
        created_at: o.created_at,
        hasMessages: o.messages.length > 0,
        job: {
          id: o.job.id,
          categoryName: o.job.category.name,
          district: formData.district || 'Kadıköy',
          details: formData.details || '',
          name: formData.name || 'Müşteri',
          status: o.job.status,
        },
      };
    });
  }

  /**
   * Hizmet verenin alıcı olduğu okunmamış mesajları listeler
   */
  async getUnreadMessages(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const unreadMessages = await this.prisma.message.findMany({
      where: {
        receiver_id: providerUserId,
        is_read: false,
      },
      include: {
        job: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return unreadMessages.map((m) => {
      const formData = m.job.form_data as any;
      return {
        id: m.id,
        content: m.content,
        createdAt: m.created_at,
        jobId: m.job_id,
        offerId: m.offer_id,
        categoryName: m.job.category.name,
        customerName: formData.name || 'Müşteri',
      };
    });
  }

  /**
   * Ustanın teklifi kabul edilen (kazanılan) işleri ve müşteri iletişim bilgilerini döner
   */
  async getWonJobs(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

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
        job: {
          include: {
            category: true,
            phone_reveal_logs: {
              where: { requester_id: provider.user_id },
            },
            job_completions: {
              where: { provider_id: provider.id },
            },
          },
        },
        seeker: true,
        offer: true,
      },
      orderBy: { accepted_at: 'desc' },
    });

    return acceptedOffers.map((ao) => {
      const formData = ao.job.form_data as any;
      const revealLogExists = ao.job.phone_reveal_logs.length > 0;
      
      let customerPhone = ao.seeker.phone_masked;
      if (revealLogExists) {
        try {
          customerPhone = decryptPhone(ao.seeker.phone);
        } catch (err) {
          this.logger.error('Telefon numarası çözümlenemedi:', err);
        }
      }

      const completion = ao.job.job_completions?.[0];
      const isPendingSeeker = completion?.status === 'pending_seeker';

      return {
        id: ao.id,
        accepted_at: ao.accepted_at,
        price: Number(ao.offer.price),
        status: ao.offer.status,
        offerId: ao.offer.id,
        isPendingSeeker,
        appointment_at: ao.offer.appointment_at,
        started_at: ao.offer.started_at,
        job: {
          id: ao.job.id,
          categoryName: ao.job.category.name,
          district: formData.district || 'Kadıköy',
          details: formData.details || '',
          name: ao.seeker.name || 'Müşteri',
          phone: customerPhone,
          phoneMasked: ao.seeker.phone_masked,
          status: ao.job.status,
          revealLogExists,
        },
      };
    });
  }

  /**
   * Hizmet veren tarafından kazanılan iş için randevu oluşturur veya günceller
   */
  async createOrUpdateAppointment(providerUserId: string, acceptedOfferId: string, appointmentAt: Date) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const acceptedOffer = await this.prisma.acceptedOffer.findUnique({
      where: { id: acceptedOfferId },
      include: {
        offer: true,
        seeker: true,
      },
    });

    if (!acceptedOffer) {
      throw new NotFoundException('Kazanılan iş bulunamadı.');
    }

    if (acceptedOffer.provider_id !== provider.id) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    const isUpdate = !!acceptedOffer.offer.appointment_at;

    const updatedOffer = await this.prisma.offer.update({
      where: { id: acceptedOffer.offer_id },
      data: { appointment_at: appointmentAt },
    });

    // Send push notification & SMS & In-app to Seeker (Customer)
    try {
      const appointmentDateStr = new Date(appointmentAt).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Istanbul',
      });

      const eventCode = isUpdate ? 'HA-RAN-GNC' : 'HA-RAN-YN';
      await this.bildirimService.sendNotification(acceptedOffer.seeker_id, eventCode, {
        hv_name: provider.user.name || 'Hizmet Veren',
        appointment_date: appointmentDateStr,
      });
    } catch (err: any) {
      this.logger.error('Randevu bildirimi gönderilirken hata oluştu:', err);
    }

    // Broadcast WebSocket update
    try {
      const room = `job_${acceptedOffer.job_id}`;
      this.chatGateway.server?.to(room).emit('appointment_updated', {
        offerId: acceptedOffer.offer_id,
        jobId: acceptedOffer.job_id,
        appointment_at: appointmentAt,
      });
    } catch (err: any) {
      this.logger.error('Randevu WebSocket yayını yapılırken hata oluştu:', err);
    }

    return updatedOffer;
  }

  /**
   * Hizmet veren tarafından işi başlatır
   */
  async startJob(providerUserId: string, acceptedOfferId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const acceptedOffer = await this.prisma.acceptedOffer.findUnique({
      where: { id: acceptedOfferId },
      include: {
        offer: true,
      },
    });

    if (!acceptedOffer) {
      throw new NotFoundException('Kazanılan iş bulunamadı.');
    }

    if (acceptedOffer.provider_id !== provider.id) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    if (!acceptedOffer.offer.appointment_at) {
      throw new BadRequestException('Lütfen önce randevu oluşturun!');
    }

    if (acceptedOffer.offer.started_at) {
      throw new BadRequestException('İş zaten başlatılmış.');
    }

    const now = new Date();
    const updatedOffer = await this.prisma.offer.update({
      where: { id: acceptedOffer.offer_id },
      data: { started_at: now },
    });

    // Broadcast WebSocket update
    try {
      const room = `job_${acceptedOffer.job_id}`;
      this.chatGateway.server?.to(room).emit('job_started', {
        offerId: acceptedOffer.offer_id,
        jobId: acceptedOffer.job_id,
        started_at: now,
      });
    } catch (err: any) {
      this.logger.error('İş başlama WebSocket yayını yapılırken hata oluştu:', err);
    }

    return updatedOffer;
  }

  /**
   * Tamamlanmış işleri listeler
   */
  async getCompletedJobs(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const completions = await this.prisma.jobCompletion.findMany({
      where: { provider_id: provider.id, status: 'completed' },
      include: {
        job: {
          include: {
            category: true,
          },
        },
        offer: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return completions.map((c) => {
      const formData = c.job.form_data as any;
      return {
        id: c.id,
        price: c.provider_declared_amount ? Number(c.provider_declared_amount) : Number(c.offer.price),
        completed_at: c.updated_at,
        commission_rate: c.offer.commission_rate ? Number(c.offer.commission_rate) : 0,
        is_direct: c.job.is_direct,
        job: {
          id: c.job.id,
          categoryName: c.job.category.name,
          district: formData.district || 'Kadıköy',
          details: formData.details || '',
          name: formData.name || 'Müşteri',
        },
      };
    });
  }

  /**
   * Hizmet verene ait onaylanmış müşteri yorumlarını listeler
   */
  async getReviews(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const reviews = await this.prisma.review.findMany({
      where: { provider_id: provider.id, status: 'approved' },
      include: {
        reviewer: true,
        job: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewerName: r.reviewer.name || 'Hizmet Alan',
      categoryName: r.job.category.name,
    }));
  }

  /**
   * Hizmet verene ait uyuşmazlık (disputed) durumundaki işleri listeler
   */
  async getDisputes(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const disputes = await this.prisma.jobCompletion.findMany({
      where: {
        provider_id: provider.id,
        status: 'disputed',
      },
      include: {
        job: {
          include: {
            category: true,
          },
        },
        offer: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return disputes.map((d) => {
      const formData = d.job.form_data as any;
      return {
        id: d.id,
        providerDeclaredAmount: d.provider_declared_amount ? Number(d.provider_declared_amount) : Number(d.offer.price),
        seekerDeclaredAmount: d.seeker_declared_amount ? Number(d.seeker_declared_amount) : 0,
        status: d.status,
        disputeStatus: d.dispute_status,
        alarmLevel: d.alarm_level,
        amountDiff: d.amount_diff ? Number(d.amount_diff) : 0,
        amountDiffPct: d.amount_diff_pct ? Number(d.amount_diff_pct) : 0,
        created_at: d.created_at,
        updated_at: d.updated_at,
        job: {
          id: d.job.id,
          categoryName: d.job.category.name,
          district: formData.district || 'Kadıköy',
          details: formData.details || '',
          name: formData.name || 'Müşteri',
        },
      };
    });
  }

  /**
   * Hizmet verenin kaybettiği veya iptal edilen tekliflerini getirir
   */
  async getLostAndCancelledJobs(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const offers = await this.prisma.offer.findMany({
      where: {
        provider_id: provider.id,
        OR: [
          { status: 'rejected' },
          { status: 'cancelled' },
          {
            status: 'pending',
            job: {
              OR: [
                { status: 'completed' },
                { status: 'cancelled' },
                {
                  offers: {
                    some: {
                      status: 'accepted',
                      provider_id: { not: provider.id },
                    },
                  },
                },
              ],
            },
          },
          // Expired jobs check
          {
            status: 'pending',
            job: {
              status: { in: ['pending', 'distributed'] },
            },
          },
        ],
      },
      include: {
        job: {
          include: {
            category: true,
            accepted_offers: {
              where: { provider_id: provider.id },
            },
            offers: {
              select: {
                id: true,
                price: true,
                created_at: true,
                provider_id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const filteredOffers = offers.filter((o) => {
      if (o.status === 'pending' && ['pending', 'distributed'].includes(o.job.status)) {
        const hasAccepted = o.job.offers.some((off) => off.status === 'accepted');
        if (hasAccepted) return true;

        const { isExpired } = getRequestExpiryInfo(o.job.created_at, Date.now(), o.job.offers);
        return isExpired;
      }
      return true;
    });

    return filteredOffers.map((o) => {
      const formData = o.job.form_data as any;
      const wasAccepted = o.job.accepted_offers.length > 0;
      
      let displayStatus = 'lost';
      let labelText = 'Teklifi Kaybettin';

      // Check if expired
      const { isExpired } = getRequestExpiryInfo(o.job.created_at, Date.now(), o.job.offers);

      if (o.status === 'cancelled') {
        if (o.cancelled_by === 'service_provider') {
          displayStatus = 'cancelled_by_provider';
          let trReason = 'Diğer';
          if (o.cancel_reason_code === 'musteri-ulasilamiyor') {
            trReason = 'Müşteriye Ulaşılamıyor';
          } else if (o.cancel_reason_code === 'musteri-vazgecti') {
            trReason = 'Müşteri Vazgeçti';
          } else if (o.cancel_reason_code === 'adreste-bulunamadi') {
            trReason = 'Adreste Bulunamadı';
          } else if (o.cancel_reason_code === 'diger' && o.cancel_reason_text) {
            trReason = o.cancel_reason_text;
          }
          labelText = `${trReason} - Hizmet Veren Tarafından İptal Edildi`;
        } else if (wasAccepted) {
          displayStatus = 'cancelled_by_seeker';
          labelText = 'İptal Edildi';
        } else if (o.job.status === 'cancelled') {
          displayStatus = 'job_cancelled';
          labelText = 'İlan İptal Edildi';
        } else {
          displayStatus = 'cancelled_by_seeker';
          labelText = 'İptal Edildi';
        }
      } else if (o.status === 'rejected') {
        displayStatus = 'lost';
        labelText = 'Teklifi Kaybettin';
      } else if (o.status === 'pending') {
        if (o.job.status === 'completed') {
          displayStatus = 'lost';
          labelText = 'Teklifi Kaybettin';
        } else if (o.job.status === 'cancelled') {
          displayStatus = 'job_cancelled';
          labelText = 'İlan İptal Edildi';
        } else if (isExpired) {
          displayStatus = 'lost';
          labelText = 'Süre Doldu (Teklifi Kaybettin)';
        } else {
          displayStatus = 'lost';
          labelText = 'Teklifi Kaybettin';
        }
      }

      // Calculate competitor offers if bidding is closed (won, completed or expired)
      const hasAccepted = o.job.offers.some((off) => off.status === 'accepted');
      const isBiddingClosed = isExpired || o.job.status === 'completed' || hasAccepted;
      
      let competitorOffers: any[] = [];
      if (isBiddingClosed) {
        // Sort all offers of the job from lowest to highest price
        const sortedOffers = [...o.job.offers].sort((a, b) => Number(a.price) - Number(b.price));
        competitorOffers = sortedOffers.map((off) => ({
          price: Number(off.price),
          isMe: off.provider_id === provider.id,
        }));
      }

      return {
        id: o.id,
        price: Number(o.price),
        message: o.message,
        status: o.status,
        displayStatus,
        labelText,
        created_at: o.created_at,
        cancelled_by: o.cancelled_by,
        cancel_reason_code: o.cancel_reason_code,
        cancel_reason_text: o.cancel_reason_text,
        job: {
          id: o.job.id,
          categoryName: o.job.category.name,
          district: formData.district || 'Kadıköy',
          details: formData.details || '',
          name: formData.name || 'Müşteri',
          status: o.job.status,
        },
        competitorOffers,
      };
    });
  }

  /**
   * Her dakika (veya test ortamında her 15 saniyede) tetiklenen gecikmeli usta bildirim işleme Cron'u
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processDelayedNotifications() {
    const now = new Date();
    const pendingNotifications = await this.prisma.responseTime.findMany({
      where: {
        notified_sent: false,
        notified_at: {
          lte: now,
        },
      },
    });

    if (pendingNotifications.length === 0) return;

    this.logger.log(`[DAĞITIM - CRON] ${pendingNotifications.length} adet planlı gecikmeli bildirim taranıyor...`);

    for (const rt of pendingNotifications) {
      try {
        const job = await this.prisma.serviceRequest.findUnique({
          where: { id: rt.job_id },
          include: { category: true },
        });

        const provider = await this.prisma.serviceProvider.findUnique({
          where: { id: rt.provider_id },
          include: { user: true },
        });

        if (!job || !provider) {
          // Bağlantısı kopuk kayıtları temizle
          await this.prisma.responseTime.update({
            where: { id: rt.id },
            data: { notified_sent: true },
          });
          continue;
        }

        const formData = job.form_data as any;
        const requestDistrict = formData.district || 'Kadıköy';

        // Teklif limitleri ve zaman aşımı kontrolleri
        const jobOffers = await this.prisma.offer.findMany({
          where: { job_id: rt.job_id },
          select: { created_at: true },
        });
        const offerCount = jobOffers.length;

        const { isExpired } = getRequestExpiryInfo(job.created_at, now.getTime(), jobOffers);

        if (offerCount >= 4 || isExpired || job.status === 'completed' || job.status === 'cancelled') {
          // Teklife kapanmışsa sadece gönderildi işaretle, bildirim atma
          await this.prisma.responseTime.update({
            where: { id: rt.id },
            data: { notified_sent: true },
          });
          continue;
        }

        const isFav = await this.prisma.favoriteProvider.findUnique({
          where: {
            seeker_id_provider_id: {
              seeker_id: job.seeker_id,
              provider_id: rt.provider_id,
            },
          },
        });

        // 1. WebSocket ile ustaya yeni iş fırsatını anlık bildir
        this.chatGateway.emitNewJobToProvider(rt.provider_id, {
          id: rt.job_id,
          categoryName: job.category.name,
          district: requestDistrict,
          details: formData.details || '',
          viewerCount: 5,
          created_at: job.created_at,
          isFavoriteCustomer: !!isFav,
          offersCount: offerCount,
        });

        // 2. FCM / Mobil Bildirim gönder
        try {
          await this.bildirimService.sendNotification(provider.user_id, 'HV-01', { jobId: rt.job_id });
        } catch (notifErr) {
          this.logger.error(`Cron delayed notification send failed for provider ${provider.id}: ${notifErr.message}`);
        }

        // 3. Bildirim tamamlandı işaretle
        await this.prisma.responseTime.update({
          where: { id: rt.id },
          data: { notified_sent: true },
        });

        this.logger.log(`[DAĞITIM - CRON] Gecikmeli bildirim başarıyla iletildi -> ${provider.user?.name || provider.id} | İş: ${job.id}`);
      } catch (err) {
        this.logger.error(`Error processing delayed notification ${rt.id}: ${err.message}`);
      }
    }
  }

  /**
   * Hizmet veren tarafından kazanılmış bir işi tek taraflı iptal eder
   */
  async cancelWonJob(providerUserId: string, acceptedOfferId: string, reasonCode: string, reasonText?: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true },
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const acceptedOffer = await this.prisma.acceptedOffer.findUnique({
      where: { id: acceptedOfferId },
      include: {
        job: {
          include: { seeker: true },
        },
        offer: true,
      },
    });

    if (!acceptedOffer) {
      throw new NotFoundException('Kazanılmış iş kaydı bulunamadı.');
    }

    if (acceptedOffer.provider_id !== provider.id) {
      throw new ForbiddenException('Bu işi iptal etmeye yetkiniz bulunmamaktadır.');
    }

    let trReason = 'Diğer Nedenler';
    if (reasonCode === 'musteri-ulasilamiyor') {
      trReason = 'Müşteriye ulaşılamıyor (Telefon/Mesajlara cevap verilmiyor)';
    } else if (reasonCode === 'musteri-vazgecti') {
      trReason = 'Müşteri işi sözlü olarak iptal etti / Vazgeçti';
    } else if (reasonCode === 'adreste-bulunamadi') {
      trReason = 'Hizmet alanı adreste bulamadım / Randevuya gelmedi';
    } else if (reasonCode === 'diger' && reasonText) {
      trReason = reasonText;
    }

    const providerName = provider.user.name || 'Hizmet Veren';

    // Transaction ile teklif ve talebi güncelle
    await this.prisma.$transaction([
      this.prisma.offer.update({
        where: { id: acceptedOffer.offer_id },
        data: {
          status: 'cancelled',
          cancelled_by: 'service_provider',
          cancel_reason_code: reasonCode,
          cancel_reason_text: reasonText || null,
          cancelled_at: new Date(),
        },
      }),
      this.prisma.serviceRequest.update({
        where: { id: acceptedOffer.job_id },
        data: {
          status: 'cancelled',
        },
      }),
    ]);

    // SMS Gönderimi (Müşteriye)
    try {
      const customerPhone = decryptPhone(acceptedOffer.job.seeker.phone);
      const smsText = `Anlasmis oldugunuz hizmet veren ${providerName} isi iptal etti. Gerekce: ${trReason}`;
      await this.authService.sendSms(customerPhone, smsText);
    } catch (err) {
      this.logger.error('Müşteriye iptal SMS\'i gönderilemedi:', err);
    }

    // In-app & push notification to customer (Seeker)
    try {
      await this.bildirimService.sendNotification(acceptedOffer.seeker_id, 'HA-IS-IPT', {
        hv_name: providerName,
        reason: trReason,
      });
    } catch (err) {
      this.logger.error('Müşteriye iptal bildirimi gönderilemedi:', err);
    }

    // WebSocket canlı bildirimi
    const room = `job_${acceptedOffer.job_id}`;
    this.chatGateway.server?.to(room).emit('job_cancelled', {
      jobId: acceptedOffer.job_id,
      cancelledBy: 'service_provider',
      reasonCode,
      reasonText: trReason,
      providerName,
    });

    // Müşterinin bireysel WebSocket bildirim odasına da gönderebiliriz
    this.chatGateway.server?.to(`seeker_${acceptedOffer.seeker_id}`).emit('job_cancelled', {
      jobId: acceptedOffer.job_id,
      cancelledBy: 'service_provider',
      reasonCode,
      reasonText: trReason,
      providerName,
    });

    return {
      message: 'İş başarıyla iptal edildi ve müşteriye bilgi verildi.',
    };
  }

  /**
   * Sadık müşteri için doğrudan iş kartı oluşturur
   */
  async createDirectJobCard(
    providerUserId: string,
    dto: { seekerId: string; price: number; categorySlug: string; details: string; district: string }
  ) {
    // 1. Hizmet veren kontrolü
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    if (!provider.is_approved) {
      throw new ForbiddenException('Hizmet veren hesabınız henüz onaylanmamıştır.');
    }

    // 2. Sadık müşteri bağlantısı kontrolü
    const connection = await this.prisma.favoriteProvider.findFirst({
      where: {
        provider_id: provider.id,
        seeker_id: dto.seekerId,
        approved: true,
      },
      include: {
        seeker: true,
      }
    });

    if (!connection) {
      throw new BadRequestException('Bu müşteri ile sadık müşteri bağlantınız bulunmamaktadır.');
    }

    // 3. Kategori bul
    const categoryName = this.getCategoryName(dto.categorySlug);
    const category = await this.prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      throw new NotFoundException(`Kategori bulunamadı: ${categoryName}`);
    }

    // 4. İş Talebi ve Teklifi transaction içinde oluştur
    const result = await this.prisma.$transaction(async (tx) => {
      // 4a. ServiceRequest oluştur (status = 'distributed')
      const request = await tx.serviceRequest.create({
        data: {
          seeker_id: dto.seekerId,
          category_id: category.id,
          form_data: {
            details: dto.details,
            name: connection.seeker?.name || 'Müşteri',
            city: this.resolveCityFromDistrict(dto.district),
            district: dto.district,
            sendToFavoritesOnly: false,
          },
          status: 'distributed',
          is_direct: true,
          direct_provider_id: provider.id,
          created_by_provider: true,
          direct_price: dto.price,
        },
      });

      // 4b. Usta için ResponseTime oluştur
      await tx.responseTime.create({
        data: {
          provider_id: provider.id,
          job_id: request.id,
          notified_at: new Date(),
          notified_sent: true,
          responded_at: new Date(),
          response_duration_minutes: 0,
        },
      });

      // 4c. Offer oluştur (status = 'pending')
      const offer = await tx.offer.create({
        data: {
          job_id: request.id,
          provider_id: provider.id,
          price: dto.price,
          message: 'Anlaşılan fiyat üzerinden doğrudan teklif oluşturuldu.',
          status: 'pending',
        },
      });

      return { request, offer };
    });

    // 5. WebSocket ile müşteriye anlık istek bildir
    try {
      this.chatGateway.server?.to(`user_${dto.seekerId}`).emit('new_direct_job_offer', {
        jobId: result.request.id,
        offerId: result.offer.id,
        price: dto.price,
        providerName: provider.user?.name || 'Hizmet Veren',
        categoryName: category.name,
        details: dto.details,
      });
    } catch (wsErr) {
      console.error('Failed to emit direct job WebSocket event:', wsErr);
    }

    return {
      success: true,
      message: 'Doğrudan iş kartı başarıyla oluşturuldu ve müşteriye gönderildi.',
      jobId: result.request.id,
      offerId: result.offer.id,
    };
  }

  private getCategoryName(slug: string): string {
    switch (slug) {
      case 'ev-temizligi': return 'Ev Temizliği';
      case 'boya-badana': return 'Boya Badana';
      case 'su-tesisati': return 'Su Tesisatı';
      case 'elektrik-tesisati': return 'Elektrik Tesisatı';
      case 'ev-tadilat': return 'Ev Tadilat';
      case 'nakliyat': return 'Nakliyat / Ev Taşıma';
      case 'hali-koltuk-yikama': return 'Halı & Koltuk Yıkama';
      case 'insaat-sonrasi-temizlik': return 'İnşaat / Tadilat Sonrası Temizlik';
      case 'fayans-parke': return 'Fayans & Parke Döşeme';
      case 'hasere-ilaclama': return 'Haşere & Böcek İlaçlama';
      case 'kombi-klima': return 'Kombi & Klima Bakımı';
      case 'mantolama-discephe': return 'Mantolama & Dış Cephe';
      case 'marangoz-mobilya': return 'Marangoz & Mobilya Montajı';
      case 'ozel-ders': return 'Özel Ders';
      default: return 'Genel Esnaf Hizmeti';
    }
  }

  private resolveCityFromDistrict(district: string): string {
    return 'İstanbul';
  }

  /**
   * Generates regional competitor statistics and AI pricing recommendations for service providers
   */
  async getCompetitorStatsReport(providerUserId: string, period: string = 'monthly') {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true }
    });
    if (!provider) {
      throw new NotFoundException('Hizmet veren kaydı bulunamadı.');
    }

    let dateLimit = new Date();
    if (period === 'weekly') {
      dateLimit.setDate(dateLimit.getDate() - 7);
    } else if (period === 'six_months') {
      dateLimit.setDate(dateLimit.getDate() - 180);
    } else {
      dateLimit.setDate(dateLimit.getDate() - 30);
    }

    const categories = await this.prisma.category.findMany({
      where: { id: { in: provider.category_ids } }
    });

    const categoryReports: any[] = [];

    for (const cat of categories) {
      const slug = this.getCategorySlugByName(cat.name);
      
      const requests = await this.prisma.serviceRequest.findMany({
        where: {
          category_id: cat.id,
          created_at: { gte: dateLimit }
        },
        include: {
          offers: {
            include: {
              provider: {
                include: { user: true }
              }
            }
          },
          accepted_offers: true
        }
      });

      // Filter requests by provider's city
      const cityRequests = requests.filter(r => {
        const fd = r.form_data as any;
        return fd && fd.city === provider.city;
      });

      const totalRequests = cityRequests.length;
      const completedRequests = cityRequests.filter(r => {
        return r.status === 'completed' || r.accepted_offers.length > 0 || r.offers.some(o => o.status === 'accepted');
      }).length;

      const competitorJobsCount: Record<string, { name: string; count: number; isMe: boolean }> = {};
      
      competitorJobsCount[provider.id] = {
        name: `SİZ (${provider.description || provider.user.name || 'Siz'})`,
        count: 0,
        isMe: true
      };

      for (const r of cityRequests) {
        for (const o of r.offers) {
          if (o.status === 'accepted') {
            const pId = o.provider_id;
            if (!competitorJobsCount[pId]) {
              competitorJobsCount[pId] = {
                name: '[Rakip İşletme - Anonim]',
                count: 0,
                isMe: false
              };
            }
            competitorJobsCount[pId].count += 1;
          }
        }
      }

      const competitorsList = Object.keys(competitorJobsCount)
        .map(pId => competitorJobsCount[pId])
        .filter(c => c.count > 0 || c.isMe)
        .sort((a, b) => b.count - a.count);

      const competitorTable = competitorsList.map((c, index) => ({
        rank: index + 1,
        name: c.isMe ? `SİZ (${provider.description || provider.user.name || 'Usta'})` : c.name,
        wonJobs: c.count,
        isMe: c.isMe
      }));

      const winningPrices = cityRequests
        .flatMap(r => r.offers)
        .filter(o => o.status === 'accepted')
        .map(o => Number(o.price));

      const winningPriceAvg = winningPrices.length > 0
        ? Math.round(winningPrices.reduce((a, b) => a + b, 0) / winningPrices.length)
        : null;

      const myPrices = cityRequests
        .flatMap(r => r.offers)
        .filter(o => o.provider_id === provider.id)
        .map(o => Number(o.price));

      const myPriceAvg = myPrices.length > 0
        ? Math.round(myPrices.reduce((a, b) => a + b, 0) / myPrices.length)
        : null;

      let advice = 'Bölgenizde henüz teklif vermediniz. İş kazanmaya başlamak için gelen taleplere rekabetçi fiyatlarla ilk teklifleri vermeyi deneyebilirsiniz.';
      if (myPriceAvg !== null && winningPriceAvg !== null) {
        if (myPriceAvg > winningPriceAvg) {
          advice = `Bu ay ${provider.city} genelinde kazanan tekliflerin fiyat ortalaması ${winningPriceAvg.toLocaleString('tr-TR')} TL olmuştur. Sizin verdiğiniz tekliflerin ortalaması ise ${myPriceAvg.toLocaleString('tr-TR')} TL'dir. Bölgenizde daha çok iş kazanmak için fiyat politikanızı veya profil yorumlarınızı gözden geçirebilirsiniz.`;
        } else {
          advice = `Tebrikler! Verdiğiniz tekliflerin ortalaması (${myPriceAvg.toLocaleString('tr-TR')} TL), bölgedeki kazanan tekliflerin ortalamasından (${winningPriceAvg.toLocaleString('tr-TR')} TL) daha cazip durumda. Profilinizi daha da zenginleştirerek ve hızlı yanıt vererek usta puanınızı yükseltebilir, iş alma şansınızı katlayabilirsiniz.`;
        }
      } else if (winningPriceAvg !== null) {
        advice = `Bölgenizde kazanan tekliflerin fiyat ortalaması ${winningPriceAvg.toLocaleString('tr-TR')} TL olmuştur. Gelecek taleplere bu fiyat dolaylarında teklif vererek ilk işinizi kazanmayı deneyebilirsiniz!`;
      }

      categoryReports.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: slug,
        summary: `${provider.city} genelinde bu dönem ${cat.name} kategorisinde toplam ${totalRequests} iş açıldı, ${completedRequests} tanesi tamamlandı.`,
        competitorTable,
        advice,
        winningPriceAvg,
        myPriceAvg
      });
    }

    return {
      city: provider.city,
      period,
      reports: categoryReports
    };
  }

  private getCategorySlugByName(name: string): string {
    switch (name) {
      case 'Ev Temizliği': return 'ev-temizligi';
      case 'Boya Badana': return 'boya-badana';
      case 'Su Tesisatı': return 'su-tesisati';
      case 'Elektrik Tesisatı': return 'elektrik-tesisati';
      case 'Ev Tadilat': return 'ev-tadilat';
      case 'Nakliyat / Ev Taşıma': return 'nakliyat';
      case 'Halı & Koltuk Yıkama': return 'hali-koltuk-yikama';
      case 'İnşaat / Tadilat Sonrası Temizlik': return 'insaat-sonrasi-temizlik';
      case 'Fayans & Parke Döşeme': return 'fayans-parke';
      case 'Haşere & Böcek İlaçlama': return 'hasere-ilaclama';
      case 'Kombi & Klima Bakımı': return 'kombi-klima';
      case 'Mantolama & Dış Cephe': return 'mantolama-discephe';
      case 'Marangoz & Mobilya Montajı': return 'marangoz-mobilya';
      case 'Özel Ders': return 'ozel-ders';
      case 'Cam Balkon & PVC Pencere': return 'cam-balkon-pvc';
      case 'Ofis & İş Yeri Temizliği': return 'ofis-temizligi';
      case 'Doğalgaz Tesisatı': return 'dogalgaz-tesisati';
      case 'İç Mimar & Dekorasyon': return 'ic-mimar-dekorasyon';
      case 'Fotoğrafçı': return 'fotografci';
      case 'Organizasyon & Etkinlik': return 'organizasyon-etkinlik';
      default: return 'genel';
    }
  }
}

export function getRequestExpiryInfo(
  createdAt: Date | string,
  compareWith: number = Date.now(),
  offers: { created_at: Date | string | number }[] = []
) {
  const createdDate = new Date(createdAt);
  
  // Turkey is permanently UTC+3 (no daylight saving time since 2016)
  // By adding 3 hours to the UTC timestamp, we can use UTC methods to get the correct local year, month, day, and hour.
  const localTime = new Date(createdDate.getTime() + 3 * 60 * 60 * 1000);
  
  const hour = localTime.getUTCHours();
  const isNight = hour >= 18 || hour < 10;
  
  let initialExpiresTime = 0;
  let initialLabel = '30 dakikalık';

  if (isNight) {
    const targetDate = new Date(localTime.getTime());
    if (hour >= 18) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    }
    
    const tYear = targetDate.getUTCFullYear();
    const tMonth = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const tDay = targetDate.getUTCDate().toString().padStart(2, '0');
    
    // Construct exact ISO timestamp for 10:00 AM Turkey local time (UTC+3)
    const istanbul10AMIso = `${tYear}-${tMonth}-${tDay}T10:00:00+03:00`;
    initialExpiresTime = new Date(istanbul10AMIso).getTime();
    initialLabel = "sabah 10:00'a kadar olan";
  } else {
    initialExpiresTime = createdDate.getTime() + 30 * 60 * 1000;
  }

  // Check if any offers arrived before the initial expiry time
  const offersBeforeExpiry = (offers || []).filter(o => {
    const offerTime = o.created_at ? new Date(o.created_at).getTime() : 0;
    return offerTime > 0 && offerTime < initialExpiresTime;
  });
  const hasOffersBeforeExpiry = offersBeforeExpiry.length > 0;

  let expiresTime = initialExpiresTime;
  let label = initialLabel;
  let isExtended = false;

  if (!hasOffersBeforeExpiry) {
    expiresTime = initialExpiresTime + 15 * 60 * 1000; // Extend by 15 minutes
    isExtended = true;
    label = isNight ? "sabah 10:15'e kadar uzatılan" : "45 dakikalık (uzatılmış)";
  }

  const isExpired = expiresTime <= compareWith;
  return { expiresTime, isExpired, label, isExtended, initialExpiresTime };
}


