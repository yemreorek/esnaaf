import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChatGateway } from '../ortak/chat/chat.gateway';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class HizmetverenService {
  private readonly logger = new Logger(HizmetverenService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
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

    return {
      success: true,
      message: 'Teklifiniz başarıyla iletildi.',
      offer: result,
    };
  }

  /**
   * Hizmet verenin profil detaylarını döner
   */
  async getProfile(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren profili bulunamadı.');
    }

    return {
      id: provider.id,
      name: provider.user.name || 'Usta',
      phone_masked: provider.user.phone_masked,
      city: provider.city || 'Adana',
      serviceDistricts: provider.service_districts || [],
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
}
