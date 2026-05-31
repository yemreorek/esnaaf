import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatGateway } from '../../ortak/chat/chat.gateway';
import { CreateTalepDto } from './dto/create-talep.dto';
import { decryptPhone } from '../../common/utils/phone.util';

@Injectable()
export class TaleplerService {
  private readonly logger = new Logger(TaleplerService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    @InjectQueue('talepler-distribution') private distributionQueue: Bull.Queue,
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
      },
      include: {
        category: true,
      },
    });

    // 3. Akıllı Dağıtım Algoritmasını BullMQ kuyruğuna ekle (Asenkron)
    await this.distributionQueue.add('distribute', { jobId: job.id });
    this.logger.log(`[Kuyruğa Eklendi] Talep ${job.id} dağıtım kuyruğuna başarıyla eklendi.`);

    return {
      success: true,
      message: 'Talebiniz başarıyla oluşturuldu ve dağıtıma başlandı.',
      job,
    };
  }

  /**
   * Müşterinin kendi taleplerini listelemesi
   */
  async findAll(seekerUserId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { seeker_id: seekerUserId },
      include: {
        category: true,
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
  }

  /**
   * Talep detaylarını ve alınan teklifleri getirme
   */
  async findOne(seekerUserId: string, jobId: string) {
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
      include: {
        category: true,
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

    // 1. Teklifi ve bağlı talebi, ustayı ve müşteriyi çek
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        job: {
          include: {
            accepted_offers: true,
            seeker: true,
          },
        },
        provider: {
          include: {
            user: true,
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

    if (offer.job.status === 'completed' || offer.job.status === 'cancelled') {
      throw new BadRequestException('Tamamlanmış veya iptal edilmiş bir talebe ait teklifi kabul edemezsiniz.');
    }

    if (offer.status !== 'pending') {
      throw new BadRequestException('Yalnızca bekleyen (pending) durumundaki teklifleri kabul edebilirsiniz.');
    }

    // 2. Maksimum 3 kabul sınırı kontrolü
    const existingAcceptedCount = offer.job.accepted_offers.length;
    if (existingAcceptedCount >= 3) {
      throw new BadRequestException('Bu talep için maksimum kabul limitine (3) ulaşılmıştır.');
    }

    const newAcceptedCount = existingAcceptedCount + 1;

    // 3. Veritabanı transaction işlemleri
    const result = await this.prisma.$transaction(async (tx) => {
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

      // Teklif durumunu 'accepted' yap
      await tx.offer.update({
        where: { id: offer.id },
        data: {
          status: 'accepted',
          accepted_at: new Date(),
        },
      });

      // Eğer 3. kabul yapıldıysa, kalan tüm 'pending' teklifleri 'rejected' yap
      if (newAcceptedCount === 3) {
        await tx.offer.updateMany({
          where: {
            job_id: offer.job_id,
            status: 'pending',
          },
          data: {
            status: 'rejected',
          },
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

    // 4. WebSocket ile odaya durum değişikliğini ve kabulü bildir
    const room = `job_${offer.job_id}`;
    this.chatGateway.server?.to(room).emit('offer_accepted', {
      jobId: offer.job_id,
      offerId: offer.id,
      providerId: offer.provider_id,
      providerName: offer.provider.user.name || 'Usta',
      acceptedCount: newAcceptedCount,
    });

    this.logger.log(`[Teklif Kabul Edildi] Müşteri ${offer.job.seeker.name || seekerUserId} tarafından Usta ${offer.provider.user.name} teklifi kabul edildi. (${newAcceptedCount}/3)`);

    // 5. Telefon numaralarını AES-256'dan çözerek mutual reveal olarak teslim et
    const seekerRealPhone = decryptPhone(offer.job.seeker.phone);
    const providerRealPhone = decryptPhone(offer.provider.user.phone);

    return {
      success: true,
      message: 'Teklif başarıyla kabul edildi ve telefon numaraları karşılıklı açıldı.',
      seekerPhone: seekerRealPhone,
      seekerName: offer.job.seeker.name || 'Müşteri',
      providerPhone: providerRealPhone,
      providerName: offer.provider.user.name || 'Usta',
      acceptedOfferId: result.id,
    };
  }
}
