import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import * as Bull from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatGateway } from '../../ortak/chat/chat.gateway';

@Processor('talepler-distribution')
@Injectable()
export class TaleplerProcessor {
  private readonly logger = new Logger(TaleplerProcessor.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
  ) {}

  @Process('distribute')
  async handleDistribution(job: Bull.Job<{ jobId: string; isFallback?: boolean }>) {
    const { jobId, isFallback } = job.data;
    this.logger.log(`[Dağıtım Başladı] Talep ID: ${jobId} (isFallback: ${!!isFallback})`);

    // 1. Talebi çek
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      include: { category: true },
    });

    if (!request) {
      this.logger.error(`Talep bulunamadı: ${jobId}`);
      return;
    }

    if (request.status === 'completed' || request.status === 'cancelled') {
      this.logger.log(`[Dağıtım İptal] Talep ${jobId} zaten completed veya cancelled durumunda.`);
      return;
    }

    const acceptedCount = await this.prisma.acceptedOffer.count({
      where: { job_id: jobId },
    });
    if (acceptedCount >= 1) {
      this.logger.log(`[Dağıtım İptal] Talep ${jobId} zaten en az bir teklif kabulü almış.`);
      return;
    }

    const formData = request.form_data as any;
    const requestDistrict = formData.district || 'Kadıköy';
    const requestCity = formData.city || 'İstanbul';

    // Favori usta öncelikli dağıtım mantığı
    const sendToFavoritesOnly = formData.sendToFavoritesOnly === true && !isFallback;
    let favoriteProviderIds: string[] = [];

    if (sendToFavoritesOnly) {
      const favorites = await this.prisma.favoriteProvider.findMany({
        where: { seeker_id: request.seeker_id },
        select: { provider_id: true },
      });
      favoriteProviderIds = favorites.map(f => f.provider_id);
      this.logger.log(`[Favori Dağıtımı] Seeker ${request.seeker_id} için favori usta sayısı: ${favoriteProviderIds.length}`);
    }

    // 2. Kategoriye kayıtlı onaylanmış ustaları çek
    const providers = await this.prisma.serviceProvider.findMany({
      where: {
        is_approved: true,
        category_ids: {
          has: request.category_id,
        },
        ...(sendToFavoritesOnly ? { id: { in: favoriteProviderIds } } : {}),
      },
      include: {
        user: true,
      },
    });

    // Eğer favori modu seçilmesine rağmen uygun favori usta bulunamazsa, hemen normal dağıtıma devret
    if (sendToFavoritesOnly && providers.length === 0) {
      this.logger.log(`[Favori Dağıtımı] Uygun favori usta bulunamadı, normal genel dağıtıma anında yönlendiriliyor.`);
      return this.handleDistribution({
        ...job,
        data: { jobId, isFallback: true },
      } as any);
    }

    // Eğer favori usta dağıtımı yapılıyorsa, 10 dk sonra fallback genel dağıtımı kuyruğa ekle
    if (sendToFavoritesOnly && providers.length > 0) {
      const delayMs = process.env.NODE_ENV === 'test' ? 1000 : 600000; // E2E testlerinde 1 sn, PRD'de 10 dk
      await job.queue.add('distribute', { jobId, isFallback: true }, { delay: delayMs });
      this.logger.log(`[Favori Dağıtımı] Fallback genel dağıtımı kuyruğa eklendi. Gecikme: ${delayMs}ms.`);
    }

    const candidates: { provider: any; score: number }[] = [];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    for (const provider of providers) {
      const providerCity = provider.city || 'Adana';
      let providerDistricts = provider.service_districts || [];
      if (providerDistricts.length === 0) {
        // Dev/Seed Compatibility: default to all 5 districts if empty
        providerDistricts = ['Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Seyhan'];
      }

      // Çoklu Şehir Sınır Koruması: Talebin ili ile hizmet verenin ili eşleşmeli
      if (providerCity.toLowerCase() !== requestCity.toLowerCase()) {
        this.logger.log(`HV ${provider.user?.name || provider.id} şehir uyuşmazlığı nedeniyle dağıtımdan elendi (Talep Şehir: ${requestCity}, HV Şehir: ${providerCity}).`);
        continue;
      }

      // İlçe Koruması: Talebin ilçesi, ustanın hizmet verebileceği ilçeler arasında olmalı
      if (!providerDistricts.map(d => d.toLowerCase()).includes(requestDistrict.toLowerCase())) {
        this.logger.log(`HV ${provider.user?.name || provider.id} ilçe uyuşmazlığı nedeniyle dağıtımdan elendi (Talep İlçe: ${requestDistrict}, HV İlçeleri: ${providerDistricts.join(', ')}).`);
        continue;
      }

      // 3. Kota Kontrolü (PRD §6): Aylık kota dolmuş mu?
      const packageLevel = this.getProviderPackage(provider);
      
      if (packageLevel.type !== 'vip') {
        const acceptedCount = await this.prisma.acceptedOffer.count({
          where: {
            provider_id: provider.id,
            accepted_at: {
              gte: startOfMonth,
            },
          },
        });

        if (acceptedCount >= packageLevel.limit) {
          this.logger.log(`HV ${provider.user?.name || provider.id} kotası dolduğu için dağıtımdan elendi.`);
          continue;
        }
      }

      // 4. Algoritma Skorlama (PRD §11 - 5 Ağırlıklı Faktör)
      const packageScore = packageLevel.weight; // %35
      const ratingScore = provider.avg_rating ? Number(provider.avg_rating) * 20 : 80; // %25 (varsayılan 4.0 -> 80 puan)
      
      // Cevap hızı (%20) - response_time_avg (dakika)
      const speedAvg = provider.response_time_avg || 30; // varsayılan 30 dk
      const speedScore = Math.max(0, Math.min(100, 100 - ((speedAvg - 5) / 115) * 100));

      // Lokasyon yakınlığı (%15)
      const proximityScore = providerDistricts.map(d => d.toLowerCase()).includes(requestDistrict.toLowerCase()) ? 100 : 20;

      // Platform aktifliği (%5) - total approved days
      const approvedAt = provider.approved_at || new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // varsayılan 5 gün önce
      const daysActive = (Date.now() - approvedAt.getTime()) / (1000 * 60 * 60 * 24);
      const tenureScore = Math.min(100, (daysActive / 365) * 100);

      // Yeni üye bonusu (ilk 30 gün ise +20)
      const newMemberBonus = daysActive <= 30 ? 20 : 0;

      // Toplam skor
      const totalScore =
        packageScore * 0.35 +
        ratingScore * 0.25 +
        speedScore * 0.20 +
        proximityScore * 0.15 +
        tenureScore * 0.05 +
        newMemberBonus;

      candidates.push({ provider, score: totalScore });
    }

    // 5. Skorlara göre sırala ve top 5-7 usta seç
    candidates.sort((a, b) => b.score - a.score);
    const selected = candidates.slice(0, 7); // max 7, min 5 (veya eldeki kadar)

    if (selected.length === 0) {
      this.logger.warn(`Talep ${jobId} için aktif kotası uygun usta bulunamadı.`);
      return;
    }

    this.logger.log(`\n================== AKILLI DAĞITIM RAPORU ==================`);
    this.logger.log(`Talep Konumu: ${requestDistrict} | Kategori: ${request.category.name}`);
    
    // 6. Seçilen her usta için response_times kaydı oluştur ve logla
    for (const item of selected) {
      const { provider, score } = item;
      const providerCity = provider.city || 'Adana';
      let providerDistricts = provider.service_districts || [];
      if (providerDistricts.length === 0) {
        providerDistricts = ['Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Seyhan'];
      }

      await this.prisma.responseTime.create({
        data: {
          provider_id: provider.id,
          job_id: request.id,
          notified_at: new Date(),
        },
      });

      const isFav = await this.prisma.favoriteProvider.findUnique({
        where: {
          seeker_id_provider_id: {
            seeker_id: request.seeker_id,
            provider_id: provider.id,
          },
        },
      });

      // WebSocket ile ustaya yeni iş dağıtımını anlık bildir
      this.chatGateway.emitNewJobToProvider(provider.id, {
        id: request.id,
        categoryName: request.category.name,
        district: requestDistrict,
        details: formData.details || '',
        viewerCount: selected.length,
        created_at: request.created_at,
        isFavoriteCustomer: !!isFav,
      });

      this.logger.log(`[DAĞITILDI] -> ${provider.user?.name || 'Usta'} (Skor: ${score.toFixed(1)} | Paket: ${this.getProviderPackage(provider).type.toUpperCase()} | Konum: ${providerCity} / ${providerDistricts.join(', ')})`);
    }
    this.logger.log(`===========================================================\n`);

    // 7. Talebi "distributed" statüsüne al
    await this.prisma.serviceRequest.update({
      where: { id: jobId },
      data: { status: 'distributed' },
    });

    // 8. WebSocket ile Seeker'a dağıtıldığını bildir
    const room = `job_${jobId}`;
    this.chatGateway.server?.to(room).emit('job_status_changed', {
      jobId,
      status: 'distributed',
      message: `Talebiniz bölgedeki en iyi ${selected.length} ustamıza ulaştırıldı.`,
    });
  }

  /**
   * Mock subscription limits based on average rating
   */
  private getProviderPackage(provider: any): { type: string; limit: number; weight: number } {
    const rating = provider.avg_rating ? Number(provider.avg_rating) : 4.0;
    if (rating >= 4.7) {
      return { type: 'vip', limit: Infinity, weight: 100 };
    } else if (rating >= 4.3) {
      return { type: 'premium', limit: 60, weight: 75 };
    } else if (rating >= 3.8) {
      return { type: 'standart', limit: 30, weight: 50 };
    } else {
      return { type: 'basic', limit: 14, weight: 25 };
    }
  }
}
