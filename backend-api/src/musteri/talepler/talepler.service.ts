import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatGateway } from '../../ortak/chat/chat.gateway';
import { CreateTalepDto } from './dto/create-talep.dto';
import { decryptPhone } from '../../common/utils/phone.util';
import { TaleplerProcessor } from './talepler.processor';
import { AuthService } from '../../ortak/auth/auth.service';

@Injectable()
export class TaleplerService {
  private readonly logger = new Logger(TaleplerService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    @InjectQueue('talepler-distribution') private distributionQueue: Bull.Queue,
    private taleplerProcessor: TaleplerProcessor,
    private authService: AuthService,
  ) {}

  /**
   * Yeni talep oluşturma ve akıllı dağıtım kuyruğuna ekleme
   */
  async create(seekerUserId: string, dto: CreateTalepDto) {
    const categoryName = this.getCategoryName(dto.categorySlug);

    // 1. Kategorinin aktifliğini ve varlığını sorgula
    const category = await this.prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      throw new NotFoundException(`Kategori bulunamadı: ${categoryName}`);
    }

    if (!category.isActive) {
      throw new BadRequestException('Bu kategori geçici olarak hizmete kapalıdır.');
    }

    // 1b. Eğer doğrudan iş ise usta bağlantısını kontrol et
    if (dto.isDirect && dto.directProviderId) {
      const isFavorite = await this.prisma.favoriteProvider.findFirst({
        where: {
          seeker_id: seekerUserId,
          provider_id: dto.directProviderId,
          approved: true,
        },
      });
      if (!isFavorite) {
        throw new BadRequestException('Bu ustaya doğrudan talep iletmek için ustanın favorilerinizde onaylı olması gerekir.');
      }
    }

    // 2. Talebi "pending" olarak oluştur
    const job = await this.prisma.serviceRequest.create({
      data: {
        seeker_id: seekerUserId,
        category_id: category.id,
        form_data: {
          details: dto.details,
          name: dto.name,
          city: this.resolveCityFromDistrict(dto.district),
          district: dto.district,
          sendToFavoritesOnly: dto.sendToFavoritesOnly === true,
        },
        status: 'pending',
        is_direct: dto.isDirect === true,
        direct_provider_id: dto.isDirect ? dto.directProviderId : null,
        created_by_provider: false,
      },
      include: {
        category: true,
      },
    });

    // 3. Akıllı Dağıtım Algoritmasını BullMQ kuyruğuna ekle (Asenkron)
    await this.distributionQueue.add('distribute', { jobId: job.id });
    this.logger.log(`[Kuyruğa Eklendi] Talep ${job.id} dağıtım kuyruğuna başarıyla eklendi.`);

    // 4. Serverless Google Cloud Run Failsafe: Run distribution synchronously in the background thread immediately!
    // Since Cloud Run may freeze background CPU when there are no HTTP requests, running it inline ensures instant matching!
    try {
      this.logger.log(`[Eşzamanlı Dağıtım Başladı] Failsafe tetikleniyor: Talep ${job.id}`);
      this.taleplerProcessor.handleDistribution({
        data: { jobId: job.id },
        queue: this.distributionQueue,
      } as any).catch(err => {
        this.logger.error(`Eşzamanlı dağıtım hatası: ${err.message}`, err.stack);
      });
    } catch (err: any) {
      this.logger.error(`Eşzamanlı dağıtım tetiklenemedi: ${err.message}`);
    }

    return {
      success: true,
      message: dto.isDirect 
        ? 'Talebiniz doğrudan ustaya iletildi.'
        : 'Talebiniz başarıyla oluşturuldu ve dağıtıma başlandı.',
      job,
    };
  }

  /**
   * Müşterinin kendi taleplerini listelemesi
   */
  async findAll(seekerUserId: string) {
    const requests = await this.prisma.serviceRequest.findMany({
      where: { seeker_id: seekerUserId },
      include: {
        category: true,
        reviews: true,
        seeker: true,
        job_completions: {
          include: {
            provider: {
              include: {
                user: true,
              },
            },
          },
        },
        offers: {
          include: {
            provider: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return requests.map(req => {
      if (req.seeker) {
        (req.seeker as any).phone_decrypted = decryptPhone(req.seeker.phone);
      }
      if (req.offers) {
        req.offers.forEach(offer => {
          if (offer.status === 'accepted' && offer.provider?.user) {
            (offer.provider.user as any).phone_decrypted = decryptPhone(offer.provider.user.phone);
          }
        });
      }
      return req;
    });
  }

  /**
   * Talep detaylarını ve alınan teklifleri getirme
   */
  async findOne(seekerUserId: string, jobId: string) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      include: {
        category: true,
        reviews: true,
        seeker: true,
        job_completions: {
          include: {
            provider: {
              include: {
                user: true,
              },
            },
          },
        },
        offers: {
          include: {
            provider: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Talep bulunamadı.');
    }

    if (job.seeker_id !== seekerUserId) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    if (job.seeker) {
      (job.seeker as any).phone_decrypted = decryptPhone(job.seeker.phone);
    }
    if (job.offers) {
      job.offers.forEach(offer => {
        if (offer.status === 'accepted' && offer.provider?.user) {
          (offer.provider.user as any).phone_decrypted = decryptPhone(offer.provider.user.phone);
        }
      });
    }

    return job;
  }

  /**
   * Talebi iptal etme (ve bekleyen teklifleri iptal etme)
   */
  async cancel(seekerUserId: string, jobId: string) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Talep bulunamadı.');
    }

    if (job.seeker_id !== seekerUserId) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new BadRequestException('Zaten tamamlanmış veya iptal edilmiş bir talebi iptal edemezsiniz.');
    }

    // Bir transaction içinde hem talebi hem bekleyen teklifleri iptal et
    await this.prisma.$transaction(async (tx) => {
      await tx.serviceRequest.update({
        where: { id: jobId },
        data: { status: 'cancelled' },
      });

      await tx.offer.updateMany({
        where: {
          job_id: jobId,
          status: 'pending',
        },
        data: { status: 'cancelled' },
      });
    });

    // WebSocket ile odadaki taraflara iptal duyurusu yap
    const room = `job_${jobId}`;
    this.chatGateway.server?.to(room).emit('job_status_changed', {
      jobId,
      status: 'cancelled',
      message: 'Müşteri talebini iptal etti.',
    });

    // Dağıtılmış olan tüm hizmet verenlerin ekranlarında iş kartını temizlemek için bildirim yolla
    try {
      const responseTimes = await this.prisma.responseTime.findMany({
        where: { job_id: jobId },
        select: { provider_id: true },
      });
      const uniqueProviderIds = [...new Set(responseTimes.map(rt => rt.provider_id))];
      uniqueProviderIds.forEach(pId => {
        this.chatGateway.server?.to(`provider_${pId}`).emit('job_cancelled', { jobId });
      });
    } catch (err) {
      this.logger.error(`WebSocket job_cancelled notification failed: ${err.message}`);
    }

    return {
      success: true,
      message: 'Talebiniz ve bekleyen tüm teklifler iptal edildi.',
    };
  }

  /**
   * 48 Saatlik Talep Yaşam Döngüsü Cron'u (PRD §4.3)
   * Her saat başı çalışır. Süresi dolan ve en az 3 kabul almamış talepleri iptal eder.
   */
  @Cron('0 * * * *')
  async handle48HourLifecycle() {
    this.logger.log('[Cron Job] 48 saatlik talep yaşam döngüsü kontrolü başlatıldı.');
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // 48 saati aşmış, hâlâ pending veya distributed durumundaki tüm talepleri çek
    const expiredJobs = await this.prisma.serviceRequest.findMany({
      where: {
        status: { in: ['pending', 'distributed'] },
        created_at: { lt: cutoff },
      },
      include: {
        accepted_offers: true,
      },
    });

    for (const job of expiredJobs) {
      // Eğer 3 veya daha fazla kabul yapılmışsa işlemde kabul edilir (durum değişmez)
      if (job.accepted_offers.length >= 3) {
        continue;
      }

      this.logger.log(`[Cron Job] Talep ${job.id} süresi dolduğu için otomatik iptal ediliyor.`);

      await this.prisma.$transaction(async (tx) => {
        // Talebi İptal Edildi yap
        await tx.serviceRequest.update({
          where: { id: job.id },
          data: { status: 'cancelled' },
        });

        // Bekleyen tüm teklifleri cancelled yap
        await tx.offer.updateMany({
          where: {
            job_id: job.id,
            status: 'pending',
          },
          data: { status: 'cancelled' },
        });
      });

      // WebSocket ile müşteriyi bilgilendir
      const room = `job_${job.id}`;
      this.chatGateway.server?.to(room).emit('job_status_changed', {
        jobId: job.id,
        status: 'cancelled',
        message: 'Talebiniz 48 saatlik geçerlilik süresi dolduğu için otomatik olarak kapatıldı.',
      });
    }
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
    const adanaDistricts = [
      'çukurova', 'yüreğir', 'sarıçam', 'ceyhan', 'seyhan'
    ];
    const istanbulDistricts = [
      'kadıköy', 'şişli', 'beşiktaş', 'ümraniye', 'üsküdar', 'fatih', 'beyoğlu', 'sarıyer', 'maltepe', 'kartal', 'pendik', 'başakşehir', 'esenyurt', 'bahçelievler', 'bakırköy', 'ataşehir', 'beylikdüzü'
    ];
    const ankaraDistricts = [
      'çankaya', 'keçiören', 'yenimahalle', 'mamak', 'etimesgut', 'sincan', 'altındağ', 'gölbaşı', 'pursaklar'
    ];
    const izmirDistricts = [
      'karşıyaka', 'konak', 'bornova', 'buca', 'karabağlar', 'çiğli', 'gaziemir', 'balçova', 'narlıdere', 'güzelbahçe', 'bayraklı', 'urla'
    ];

    const dLower = district.toLowerCase();
    if (adanaDistricts.includes(dLower)) return 'Adana';
    if (istanbulDistricts.includes(dLower)) return 'İstanbul';
    if (ankaraDistricts.includes(dLower)) return 'Ankara';
    if (izmirDistricts.includes(dLower)) return 'İzmir';
    return 'Adana';
  }

  /**
   * Müşterinin usta teklifini kabul etmesi ve telefonların paylaşılması (§8.3)
   */
  async acceptOffer(seekerUserId: string, offerId: string, consent: boolean) {
    if (consent !== true) {
      throw new BadRequestException('Telefon numaralarının karşılıklı paylaşılması için onay (consent) vermelisiniz.');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        job: {
          include: {
            offers: true,
            accepted_offers: {
              include: {
                offer: true,
              },
            },
            seeker: true,
          },
        },
        provider: {
          include: {
            user: true,
            subscription: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException('Teklif bulunamadı.');
    }

    if (offer.job.seeker_id !== seekerUserId) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    if (offer.job.status === 'completed') {
      throw new BadRequestException('Tamamlanmış bir talebe ait teklifi kabul edemezsiniz.');
    }

    if (offer.job.status === 'cancelled') {
      const wasCancelledByProvider = offer.job.offers.some(
        o => o.status === 'cancelled' && o.cancelled_by === 'service_provider'
      );
      if (!wasCancelledByProvider) {
        throw new BadRequestException('İptal edilmiş bir talebe ait teklifi kabul edemezsiniz.');
      }
    }

    if (offer.status !== 'pending' && !(offer.status === 'cancelled' && offer.cancelled_by !== 'service_provider')) {
      throw new BadRequestException('Yalnızca bekleyen veya yedek durumundaki teklifleri kabul edebilirsiniz.');
    }

    const isReAccept = offer.status === 'cancelled';

    // 2. Önceden kabul edilmiş aktif teklifleri filtrele
    const activePreviousAcceptedOffers = offer.job.accepted_offers.filter(ao => ao.offer.status === 'accepted');

    // 2.5. Komisyon oranı hesaplama ve "Sadık Müşteri" hakkı kontrolü
    const COMMISSION_RATES: Record<string, number> = {
      basic: 10,
      standard: 7,
      premium: 5,
      vip: 5,
    };

    let commissionRate = 10; // Varsayılan/Fallback oranı %10
    let updateOpenDoorToFalse = false;

    if (offer.job.is_direct) {
      commissionRate = 0;
    } else {
      // Havuz işi: Ustanın "Sadık Müşteri" hakkı aktif mi?
      if (offer.provider.open_door_right) {
        commissionRate = 0;
        updateOpenDoorToFalse = true;
      } else {
        const sub = offer.provider.subscription;
        const activeStatuses = ['active', 'trial', 'admin_trial'];
        if (sub && activeStatuses.includes(sub.status)) {
          commissionRate = COMMISSION_RATES[sub.package_type] ?? 10;
        }
      }
    }

    // 3. Veritabanı transaction işlemleri
    const result = await this.prisma.$transaction(async (tx) => {
      // Önceki aktif kabulleri iptal et
      for (const prev of activePreviousAcceptedOffers) {
        await tx.offer.update({
          where: { id: prev.offer_id },
          data: {
            status: 'cancelled',
            cancelled_by: 'service_seeker',
            cancel_reason_code: 'switch-offer',
            cancel_reason_text: 'Müşteri başka bir teklifi kabul etmeyi seçti.',
            cancelled_at: new Date(),
          },
        });
      }

      // Talebi tekrar 'distributed' durumuna çek (e.g. usta iptal ettiği için 'cancelled' olmuşsa)
      if (offer.job.status === 'cancelled') {
        await tx.serviceRequest.update({
          where: { id: offer.job_id },
          data: { status: 'distributed' },
        });
      }

      // Kabul edilmiş teklif kaydı oluştur
      const accepted = await tx.acceptedOffer.create({
        data: {
          job_id: offer.job_id,
          offer_id: offer.id,
          seeker_id: seekerUserId,
          provider_id: offer.provider_id,
          seeker_consent: true,
          seeker_consent_at: new Date(),
        },
      });

      // Teklif durumunu 'accepted' yap ve iptal alanlarını sıfırla, komisyonu mühürle
      await tx.offer.update({
        where: { id: offer.id },
        data: {
          status: 'accepted',
          accepted_at: new Date(),
          cancelled_by: null,
          cancel_reason_code: null,
          cancel_reason_text: null,
          cancelled_at: null,
          commission_rate: commissionRate,
        },
      });

      // Eğer Sadık Müşteri hakkı kullanıldıysa, hakkı pasifleştir (FALSE yap)
      if (updateOpenDoorToFalse) {
        await tx.serviceProvider.update({
          where: { id: offer.provider_id },
          data: { open_door_right: false },
        });
      }

      // KVKK uyumluluğu için karşılıklı telefon açılma günlüğü yaz
      // Seeker -> Provider
      await tx.phoneRevealLog.create({
        data: {
          requester_id: seekerUserId,
          revealed_user_id: offer.provider.user_id,
          job_id: offer.job_id,
        },
      });

      // Provider -> Seeker
      await tx.phoneRevealLog.create({
        data: {
          requester_id: offer.provider.user_id,
          revealed_user_id: seekerUserId,
          job_id: offer.job_id,
        },
      });

      return accepted;
    });

    // 4. WebSocket ile eski usta(lar)ı ve odayı bilgilendir
    for (const prev of activePreviousAcceptedOffers) {
      this.chatGateway.server?.to(`provider_${prev.provider_id}`).emit('offer_cancelled', {
        jobId: offer.job_id,
        offerId: prev.offer_id,
      });
    }

    // Yeni ustaya veya yeniden kabul edilen ustaya anlık bildirim fırlat
    this.chatGateway.server?.to(`provider_${offer.provider_id}`).emit('offer_accepted_notification', {
      jobId: offer.job_id,
      offerId: offer.id,
      isReAccept,
    });

    const room = `job_${offer.job_id}`;
    this.chatGateway.server?.to(room).emit('offer_accepted', {
      jobId: offer.job_id,
      offerId: offer.id,
      providerId: offer.provider_id,
      providerName: offer.provider.user.name || 'Hizmet Veren',
      acceptedCount: 1,
    });

    try {
      const responseTimes = await this.prisma.responseTime.findMany({
        where: { job_id: offer.job_id },
        select: { provider_id: true },
      });
      for (const rt of responseTimes) {
        if (rt.provider_id !== offer.provider_id) {
          this.chatGateway.server?.to(`provider_${rt.provider_id}`).emit('job_closed', {
            jobId: offer.job_id,
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Failed to broadcast job_closed: ${err.message}`);
    }

    this.logger.log(`[Teklif Kabul Edildi] Müşteri ${offer.job.seeker.name || seekerUserId} tarafından Hizmet Veren ${offer.provider.user.name} teklifi kabul edildi. (Yeniden Kabul: ${isReAccept})`);

    // 5. Telefon numaralarını AES-256'dan çözerek mutual reveal olarak teslim et
    const seekerRealPhone = decryptPhone(offer.job.seeker.phone);
    const providerRealPhone = decryptPhone(offer.provider.user.phone);

    // Yeniden kabul durumunda ustaya SMS gönder
    if (isReAccept) {
      try {
        const smsText = `Musteri teklifinizi yeniden kabul etti! Kazanilan Isler sekmesinden detaya ulasabilirsiniz.`;
        await this.authService.sendSms(providerRealPhone, smsText);
      } catch (err) {
        this.logger.error('Yeniden kabul SMS\'i gönderilemedi:', err);
      }
    }

    return {
      success: true,
      message: 'Teklif başarıyla kabul edildi ve telefon numaraları karşılıklı açıldı.',
      seekerPhone: seekerRealPhone,
      seekerName: offer.job.seeker.name || 'Müşteri',
      providerPhone: providerRealPhone,
      providerName: offer.provider.user.name || 'Hizmet Veren',
      acceptedOfferId: result.id,
    };
  }

  /**
   * Hizmet verenin detaylı profil bilgilerini getirir (müşteriye özel görünüm)
   */
  async getProviderProfile(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            name: true,
            phone_masked: true,
          },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren bulunamadı.');
    }

    let descriptionObj: any = {};
    try {
      if (provider.description && provider.description.startsWith('{')) {
        descriptionObj = JSON.parse(provider.description);
      } else {
        descriptionObj = { descriptionText: provider.description || '' };
      }
    } catch (e) {
      descriptionObj = { descriptionText: provider.description || '' };
    }

    // Kategorileri çek
    const categories = await this.prisma.category.findMany({
      where: {
        id: {
          in: provider.category_ids,
        },
      },
      select: {
        name: true,
      },
    });

    // Onaylanmış yorumları çek
    const reviews = await this.prisma.review.findMany({
      where: {
        provider_id: provider.id,
        status: 'approved',
      },
      include: {
        reviewer: {
          select: {
            name: true,
          },
        },
        job: {
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Memnuniyet oranı hesapla (4 ve 5 yıldızlı yorumlar)
    const satisfiedCount = reviews.filter((r) => r.rating >= 4).length;
    const satisfactionRate = reviews.length > 0 ? Math.round((satisfiedCount / reviews.length) * 100) : 100;

    // Yorum yapan ismini maskele
    const maskReviewerName = (name: string) => {
      if (!name) return 'Müşteri';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
    };

    return {
      id: provider.id,
      name: provider.user.name || 'Hizmet Veren',
      phone_masked: provider.user.phone_masked,
      city: provider.city || 'Adana',
      service_districts: provider.service_districts || [],
      total_jobs: provider.total_jobs,
      avg_rating: provider.avg_rating ? Number(provider.avg_rating) : 5.0,
      categories: categories.map((c) => c.name),
      is_approved: provider.is_approved,
      description: {
        companyType: descriptionObj.companyType || 'bireysel',
        companyName: descriptionObj.companyName || '',
        descriptionText: descriptionObj.descriptionText || '',
        profilePhoto: descriptionObj.profilePhoto || '',
        referencePhotos: descriptionObj.referencePhotos || [],
      },
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment || '',
        created_at: r.created_at,
        reviewer_name: maskReviewerName(r.reviewer.name || 'Müşteri'),
        category_name: r.job?.category?.name || 'Genel Hizmet',
      })),
      satisfaction_rate: satisfactionRate,
    };
  }
}
