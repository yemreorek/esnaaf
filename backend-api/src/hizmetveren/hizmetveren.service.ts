import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChatGateway } from '../ortak/chat/chat.gateway';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDocumentsDto } from './dto/update-documents.dto';
import { decryptPhone } from '../common/utils/phone.util';
import { BildirimService } from '../ortak/bildirimler/bildirim.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class HizmetverenService {
  private readonly logger = new Logger(HizmetverenService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private bildirimService: BildirimService,
    private redis: RedisService,
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

    // 2. Bu ustaya dağıtılmış response_time kayıtlarını al
    const responseTimes = await this.prisma.responseTime.findMany({
      where: { provider_id: provider.id },
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

      if (job.offers.length > 0) {
        // Zaten teklif verilmiş
        continue;
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
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Bu ay kabul edilen işlerin sayısı
    const used = await this.prisma.acceptedOffer.count({
      where: {
        provider_id: provider.id,
        accepted_at: {
          gte: startOfMonth,
        },
      },
    });

    const rating = provider.avg_rating ? Number(provider.avg_rating) : 4.0;
    const packageLevel = this.getProviderPackage(rating);

    const limit = packageLevel.limit === Infinity ? null : packageLevel.limit;
    const remaining = limit !== null ? Math.max(0, limit - used) : null;

    return {
      providerId: provider.id,
      providerName: provider.user.name || 'Usta',
      packageName: packageLevel.type,
      used,
      limit,
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
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    if (!provider.is_approved) {
      throw new ForbiddenException('Hizmet veren hesabınız henüz onaylanmamıştır.');
    }

    // 2. Kota kontrolü
    const quota = await this.getQuotaStatus(providerUserId);
    if (quota.remaining !== null && quota.remaining <= 0) {
      throw new BadRequestException('Aylık iş kabul kotanız dolmuştur. Yeni teklif veremezsiniz.');
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
      providerId: provider.id,
      providerName: provider.user.name || 'Usta',
      providerRating: provider.avg_rating ? Number(provider.avg_rating) : 4.0,
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
    const cacheKey = `provider:profile:${providerUserId}`;
    return this.redis.getOrSet(cacheKey, async () => {
      const provider = await this.prisma.serviceProvider.findUnique({
        where: { user_id: providerUserId },
        include: { user: true },
      });

      if (!provider) {
        throw new NotFoundException('Hizmet veren profili bulunamadı.');
      }

      let onboardingData: any = {};
      try {
        if (provider.description && provider.description.startsWith('{')) {
          onboardingData = JSON.parse(provider.description);
        }
      } catch (e) {
        // ignore
      }

      const healthScore = await this.calculateProviderHealthScore(provider.id, provider);

      return {
        id: provider.id,
        name: provider.user.name || 'Usta',
        phone_masked: provider.user.phone_masked,
        city: provider.city || 'Adana',
        serviceDistricts: provider.service_districts || [],
        isApproved: provider.is_approved,
        identityDocument: onboardingData.identityDocument || '',
        taxPlateDocument: onboardingData.taxPlateDocument || '',
        companyType: onboardingData.companyType || '',
        companyName: onboardingData.companyName || '',
        healthScore,
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

    await this.redis.del(`provider:profile:${providerUserId}`);

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

    const updated = await this.prisma.serviceProvider.update({
      where: { id: provider.id },
      data: {
        city: dto.city,
        service_districts: dto.serviceDistricts,
      },
    });

    await this.redis.del(`provider:profile:${providerUserId}`);

    return {
      success: true,
      message: 'Profil konum bilgileriniz başarıyla güncellendi.',
      provider: {
        id: updated.id,
        city: updated.city,
        serviceDistricts: updated.service_districts,
      },
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
      where: { provider_id: provider.id },
      include: {
        job: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return offers.map((o) => {
      const formData = o.job.form_data as any;
      return {
        id: o.id,
        price: Number(o.price),
        message: o.message,
        status: o.status,
        created_at: o.created_at,
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
      where: { provider_id: provider.id },
      include: {
        job: {
          include: {
            category: true,
            phone_reveal_logs: {
              where: { requester_id: provider.user_id },
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

      return {
        id: ao.id,
        accepted_at: ao.accepted_at,
        price: Number(ao.offer.price),
        status: ao.offer.status,
        offerId: ao.offer.id,
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
}
