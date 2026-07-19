import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import * as Bull from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatGateway } from '../../ortak/chat/chat.gateway';
import { BildirimService } from '../../ortak/bildirimler/bildirim.service';

@Processor('talepler-distribution')
@Injectable()
export class TaleplerProcessor {
  private readonly logger = new Logger(TaleplerProcessor.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private bildirimService: BildirimService,
  ) {}

  @Process('distribute')
  async handleDistribution(job: Bull.Job<{ jobId: string; isFallback?: boolean; previousProviderIds?: string[] }>) {
    const { jobId, isFallback, previousProviderIds } = job.data;
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

    // 1b. Eğer doğrudan iş/ilan ise, dağıtımı direkt tek bir ustaya yap
    if (request.is_direct && request.direct_provider_id) {
      this.logger.log(`[Dağıtım - Doğrudan] Talep ${jobId} doğrudan usta ${request.direct_provider_id} için yönlendiriliyor.`);
      
      // Talebi distributed yap
      await this.prisma.serviceRequest.update({
        where: { id: jobId },
        data: { status: 'distributed' },
      });

      // Ustayı çek
      const provider = await this.prisma.serviceProvider.findUnique({
        where: { id: request.direct_provider_id },
        include: { user: true },
      });

      if (provider) {
        // ResponseTime oluştur
        await this.prisma.responseTime.create({
          data: {
            provider_id: provider.id,
            job_id: request.id,
            notified_at: new Date(),
            notified_sent: true,
          },
        });

        const formData = request.form_data as any;
        const requestDistrict = formData.district || 'Kadıköy';

        // WebSocket ile usta odasına bildir
        this.chatGateway.emitNewJobToProvider(provider.id, {
          id: request.id,
          categoryName: request.category.name,
          district: requestDistrict,
          details: formData.details || '',
          viewerCount: 1,
          created_at: request.created_at,
          isFavoriteCustomer: true,
          isDirectRequest: true,
          createdByProvider: request.created_by_provider,
          directPrice: request.direct_price ? Number(request.direct_price) : null,
          offersCount: 0,
        });

        // Usta kullanıcısına HV-01 şablonuyla in-app/push bildirimi gönder
        try {
          await this.bildirimService.sendNotification(provider.user_id, 'HV-01', { jobId: request.id });
        } catch (notifErr: any) {
          this.logger.error(`Doğrudan dağıtım bildirimi gönderilemedi: ${notifErr.message}`);
        }
      }
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
        account_status: 'active',
        is_available: true,
        category_ids: {
          has: request.category_id,
        },
        ...(sendToFavoritesOnly ? { id: { in: favoriteProviderIds } } : {}),
      },
      include: {
        user: true,
        subscription: true,
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

    const candidates: { provider: any; score: number; healthScore: number; packageLevel: any }[] = [];

    for (const provider of providers) {
      const providerCity = provider.city || 'Adana';
      let providerDistricts = provider.service_districts || [];
      if (providerDistricts.length === 0) {
        if (providerCity === 'İstanbul') {
          providerDistricts = ['Kadıköy', 'Şişli', 'Beşiktaş', 'Ümraniye', 'Üsküdar', 'Fatih', 'Beyoğlu', 'Sarıyer', 'Maltepe', 'Kartal', 'Pendik', 'Başakşehir', 'Esenyurt', 'Bahçelievler', 'Bakırköy', 'Ataşehir', 'Beylikdüzü'];
        } else if (providerCity === 'Ankara') {
          providerDistricts = ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut', 'Sincan', 'Altındağ', 'Gölbaşı', 'Pursaklar'];
        } else if (providerCity === 'İzmir') {
          providerDistricts = ['Karşıyaka', 'Konak', 'Bornova', 'Buca', 'Karabağlar', 'Çiğli', 'Gaziemir', 'Balçova', 'Narlıdere', 'Güzelbahçe', 'Bayraklı', 'Urla'];
        } else {
          providerDistricts = [
            'Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan', 
            'İmamoğlu', 'Karataş', 'Karaisalı', 'Pozantı', 'Yumurtalık', 
            'Tufanbeyli', 'Feke', 'Aladağ', 'Saimbeyli'
          ];
        }
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

      // 3. Kota Kontrolü (PRD §6): Aktif Kapasite Kilidi dolmuş mu?
      const packageLevel = this.getProviderPackage(provider);
      
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
        if (ao.offer.started_at) return true;
        if (!ao.offer.appointment_at) return true;
        const appointmentTime = new Date(ao.offer.appointment_at).getTime();
        const twentyFourHoursFromNow = now.getTime() + 24 * 60 * 60 * 1000;
        return appointmentTime <= twentyFourHoursFromNow;
      }).length;

      if (activeJobsCount >= packageLevel.limit) {
        this.logger.log(`HV ${provider.user?.name || provider.id} aktif iş kapasite limiti (${packageLevel.limit}) dolduğu için dağıtımdan elendi.`);
        continue;
      }

      // 4. Algoritma Skorlama (PRD §11 - 5 Ağırlıklı Faktör + Sağlık Skoru)
      const healthScore = await this.calculateProviderHealthScore(provider.id, provider);
      
      const packageScore = packageLevel.weight; // %30
      const ratingScore = provider.avg_rating ? Number(provider.avg_rating) * 20 : 80; // %20 (varsayılan 4.0 -> 80 puan)
      
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

      // Tekrar yayınlama bonusu: Daha önce teklif veren ustalar +30 puan
      const republishBonus = (previousProviderIds && previousProviderIds.includes(provider.id)) ? 30 : 0;

      // Toplam skor (Sağlık Skoru entegrasyonuyla yeniden tasarlandı)
      const totalScore =
        packageScore * 0.30 +
        healthScore * 0.30 +
        ratingScore * 0.20 +
        proximityScore * 0.15 +
        tenureScore * 0.05 +
        newMemberBonus +
        republishBonus;

      candidates.push({ provider, score: totalScore, healthScore, packageLevel });
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
    
    const packageConfigs = await this.prisma.systemPackageConfig.findMany();

    // 6. Seçilen her usta için response_times kaydı oluştur ve logla
    for (const item of selected) {
      const { provider, score, packageLevel } = item;
      const providerCity = provider.city || 'Adana';
      let providerDistricts = provider.service_districts || [];
      if (providerDistricts.length === 0) {
        providerDistricts = [
          'Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan', 
          'İmamoğlu', 'Karataş', 'Karaisalı', 'Pozantı', 'Yumurtalık', 
          'Tufanbeyli', 'Feke', 'Aladağ', 'Saimbeyli'
        ];
      }

      // Paket bazlı kademeli gecikme süreleri (VIP: 0 dk, Standard: 5 dk, Basic: 10 dk, Ücretsiz: 15 dk)
      let delayMinutes = 15;
      const matchedConfig = packageConfigs.find(c => c.package_type === packageLevel.type);
      if (matchedConfig) {
        delayMinutes = matchedConfig.delay_minutes;
      } else {
        if (packageLevel.type === 'vip') {
          delayMinutes = 0;
        } else if (packageLevel.type === 'standard') {
          delayMinutes = 5;
        } else if (packageLevel.type === 'basic') {
          delayMinutes = 10;
        }
      }

      // Test modunda süreleri saniyeye indirge
      let delayMs = delayMinutes * 60 * 1000;
      if (process.env.NODE_ENV === 'test') {
        delayMs = delayMinutes * 1000;
      }

      const notifiedAt = new Date(Date.now() + delayMs);
      const isInstant = notifiedAt.getTime() <= Date.now();

      await this.prisma.responseTime.create({
        data: {
          provider_id: provider.id,
          job_id: request.id,
          notified_at: notifiedAt,
          notified_sent: isInstant,
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

      if (isInstant) {
        // WebSocket ile ustaya yeni iş dağıtımını anlık bildir
        this.chatGateway.emitNewJobToProvider(provider.id, {
          id: request.id,
          categoryName: request.category.name,
          district: requestDistrict,
          details: formData.details || '',
          viewerCount: selected.length,
          created_at: request.created_at,
          isFavoriteCustomer: !!isFav,
          offersCount: 0,
        });

        // Send push notification to the provider
        try {
          await this.bildirimService.sendNotification(provider.user_id, 'HV-01', { jobId: request.id });
        } catch (notifErr) {
          this.logger.error(`Failed to send job distribution notification to provider ${provider.id}: ${notifErr.message}`);
        }
      }

      // OTONOM DEMO: Otomatik teklif (gecikme bitiminden 3 saniye sonra tetiklenir)
      setTimeout(async () => {
        try {
          // Double-check if offer already exists to prevent duplicate key errors
          const existing = await this.prisma.offer.findUnique({
            where: {
              job_id_provider_id: {
                job_id: request.id,
                provider_id: provider.id,
              }
            }
          });
          if (existing) return;

          const defaultPrice = provider.user.name.includes('Aylin') ? 1350 : 1200;
          const defaultMsg = provider.user.name.includes('Aylin')
            ? `Merhabalar, Adana genelinde ${request.category.name} hizmetleri vermekteyiz. 1 Yıl işçilik garantili ve faturalı çalışmaktayız. Şimdiden hayırlı olsun.`
            : `Selamlar efendim! ${request.category.name} işiniz için hazırız. Yanımızda profesyonel ekipmanlarımızı getirip pürüzsüzce teslim edeceğiz. Saygılar.`;

          const offer = await this.prisma.offer.create({
            data: {
              job_id: request.id,
              provider_id: provider.id,
              price: defaultPrice,
              message: defaultMsg,
              status: 'pending',
            }
          });

          // WebSocket ile müşteriye yeni teklif ulaştığını anlık bildir
          this.chatGateway.emitNewOffer(request.id, {
            id: offer.id,
            price: Number(offer.price),
            description: offer.message,
            created_at: offer.created_at,
            providerId: provider.id,
            providerName: provider.user.name,
            providerRating: Number(provider.avg_rating || 4.8),
            providerIsApproved: provider.is_approved,
            providerSubscription: provider.subscription ? {
              status: provider.subscription.status,
              package_type: provider.subscription.package_type,
            } : null,
          });
          
          this.logger.log(`[OTONOM TEKLİF] Canlı veritabanı teklifi oluşturuldu: ${provider.user.name} -> ${offer.price} TL`);
        } catch (err) {
          this.logger.error(`Otonom teklif hatası: ${err.message}`);
        }
      }, isInstant ? 3000 : (delayMs + 3000));

      this.logger.log(`[DAĞITILDI] -> ${provider.user?.name || 'Hizmet Veren'} (Skor: ${score.toFixed(1)} | Sağlık Skoru: %${item.healthScore} | Paket: ${packageLevel.type.toUpperCase()} | Gecikme: ${delayMinutes} dk | Konum: ${providerCity} / ${providerDistricts.join(', ')})`);
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
   * Get subscription limits from DB subscription
   */
  private getProviderPackage(provider: any): { type: string; limit: number; weight: number } {
    let type = 'free';
    let limit = 1;
    let weight = 10;

    const sub = provider.subscription;
    if (sub && ['active', 'trial', 'admin_trial'].includes(sub.status)) {
      if (sub.package_type === 'vip') {
        type = 'vip';
        limit = 7;
        weight = 100;
      } else if (sub.package_type === 'standard' || sub.package_type === 'premium') {
        type = 'standard';
        limit = 5;
        weight = 60;
      } else if (sub.package_type === 'basic') {
        type = 'basic';
        limit = 3;
        weight = 25;
      }
    }

    return { type, limit, weight };
  }

  /**
   * Dinamik Usta Sağlık Skorunu Hesaplar (0-100 Puan)
   */
  private async calculateProviderHealthScore(providerId: string, provider: any): Promise<number> {
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
}
