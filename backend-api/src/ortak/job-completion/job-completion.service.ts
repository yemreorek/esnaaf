import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { DeclareCompletionDto } from './dto/declare-completion.dto';
import { ConfirmCompletionDto } from './dto/confirm-completion.dto';
import { AlarmLevel, DisputeStatus, JobCompletionStatus } from '@prisma/client';
import { encryptPhone, maskPhone } from '../../common/utils/phone.util';
import { BildirimService } from '../bildirimler/bildirim.service';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class JobCompletionService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private bildirimService: BildirimService,
    private referralService: ReferralService,
  ) {}

  /**
   * Hizmet Veren (HV) iş bitiş beyanı
   */
  async declareCompletion(providerUserId: string, jobId: string, dto: DeclareCompletionDto) {
    // 1. İşin varlığını ve durumunu doğrula
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Talep bulunamadı.');
    }

    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new BadRequestException('Bu talep zaten tamamlanmış veya iptal edilmiş.');
    }

    // 2. Hizmet veren profilini doğrula
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId },
      include: { user: true },
    });

    if (!provider) {
      throw new ForbiddenException('Hizmet veren profiliniz bulunamadı.');
    }

    // 3. İlgili iş için onaylanmış bir teklif var mı kontrol et
    const acceptedOffer = await this.prisma.acceptedOffer.findFirst({
      where: {
        job_id: jobId,
        provider_id: provider.id,
      },
      include: {
        offer: true,
      },
    });

    if (!acceptedOffer) {
      throw new ForbiddenException('Bu iş için onaylanmış bir teklifiniz bulunmamaktadır.');
    }

    if (!acceptedOffer.offer.started_at) {
      throw new BadRequestException('Lütfen önce işe başlayın!');
    }

    // 4. Mükerrer beyan kontrolü
    const existingCompletion = await this.prisma.jobCompletion.findFirst({
      where: { job_id: jobId, provider_id: provider.id },
    });

    if (existingCompletion && existingCompletion.provider_confirmed) {
      throw new BadRequestException('Bu iş için zaten tamamlama beyanında bulundunuz.');
    }

    // 5. JobCompletion kaydını oluştur veya güncelle
    let completion;
    if (existingCompletion) {
      completion = await this.prisma.jobCompletion.update({
        where: { id: existingCompletion.id },
        data: {
          provider_declared_amount: dto.price,
          provider_confirmed: true,
          provider_confirmed_at: new Date(),
          status: JobCompletionStatus.pending_seeker,
        },
      });
    } else {
      completion = await this.prisma.jobCompletion.create({
        data: {
          job_id: jobId,
          offer_id: acceptedOffer.offer_id,
          provider_id: provider.id,
          seeker_id: acceptedOffer.seeker_id,
          provider_declared_amount: dto.price,
          provider_confirmed: true,
          provider_confirmed_at: new Date(),
          status: JobCompletionStatus.pending_seeker,
        },
      });
    }

    // 6. Canlı WebSocket Bildirimi Gönder (Müşteriye anında onay kartı çıkar)
    this.chatGateway.emitJobCompletedByProvider(jobId, {
      jobId,
      providerId: provider.id,
      providerName: provider.user?.name || 'Usta',
      price: dto.price,
      note: dto.note || '',
    });

    return {
      success: true,
      message: 'İş tamamlama beyanınız kaydedildi, müşteri onayı bekleniyor.',
      completionId: completion.id,
    };
  }

  /**
   * Hizmet Alan (HA) onay veya itiraz aksiyonu
   */
  async confirmCompletion(seekerUserId: string, jobId: string, dto: ConfirmCompletionDto) {
    // 1. Aktif teyit bekleyen beyanı bul
    const completion = await this.prisma.jobCompletion.findFirst({
      where: {
        job_id: jobId,
        status: JobCompletionStatus.pending_seeker,
      },
    });

    if (!completion) {
      throw new NotFoundException('Bu iş için teyit bekleyen bir beyan bulunamadı.');
    }

    // 2. İşlemi yapanın gerçek talep sahibi olduğunu doğrula
    if (completion.seeker_id !== seekerUserId) {
      throw new ForbiddenException('Bu talep üzerinde işlem yapma yetkiniz bulunmamaktadır.');
    }

    if (completion.seeker_confirmed) {
      throw new BadRequestException('Bu iş için zaten teyit verdiniz.');
    }

    // 3. Tutar hesaplamaları ve itiraz tespiti
    let seekerDeclaredAmount: number;
    let alarmLevel: AlarmLevel = AlarmLevel.none;
    let disputeStatus: DisputeStatus = DisputeStatus.none;
    let finalStatus: JobCompletionStatus = JobCompletionStatus.completed;

    if (dto.confirmed) {
      // Müşteri ustanın beyan ettiği tutarı aynen onayladı
      seekerDeclaredAmount = Number(completion.provider_declared_amount);
      alarmLevel = AlarmLevel.none;
    } else {
      // Müşteri farklı bir tutar beyan etti veya hizmeti hiç almadığını söyledi
      if (dto.declaredAmount === undefined) {
        throw new BadRequestException('Lütfen ödediğiniz gerçek tutarı belirtin.');
      }
      seekerDeclaredAmount = dto.declaredAmount;

      // Eğer tutar 0 ise "Hizmeti almadım / Eksik yapıldı" demektir (Senaryo D - Kırmızı Alarm)
      if (seekerDeclaredAmount === 0) {
        alarmLevel = AlarmLevel.red;
        disputeStatus = DisputeStatus.open;
        finalStatus = JobCompletionStatus.disputed;
      } else {
        // Tutar sapma oranını hesapla: |HV - HA| / HA * 100
        const providerAmt = Number(completion.provider_declared_amount);
        const diff = Math.abs(providerAmt - seekerDeclaredAmount);
        const diffPct = (diff / seekerDeclaredAmount) * 100;

        // Eşik değerlerine göre alarm belirleme
        if (diffPct === 0) {
          alarmLevel = AlarmLevel.none;
        } else if (diffPct <= 15) {
          alarmLevel = AlarmLevel.info;
        } else if (diffPct <= 30) {
          alarmLevel = AlarmLevel.yellow;
          disputeStatus = DisputeStatus.open; // %16-30 direkt uyuşmazlığa (Sarı Alarm) girer
          finalStatus = JobCompletionStatus.disputed;
        } else {
          alarmLevel = AlarmLevel.red;
          disputeStatus = DisputeStatus.open; // %31+ direkt uyuşmazlığa (Kırmızı Alarm) girer
          finalStatus = JobCompletionStatus.disputed;
        }
      }
    }

    const providerAmt = Number(completion.provider_declared_amount);
    const diff = Math.abs(providerAmt - seekerDeclaredAmount);
    const diffPct = seekerDeclaredAmount > 0 ? (diff / seekerDeclaredAmount) * 100 : 100;

    // 4. Veritabanını güncelle (İşlemi bir transaction içinde yap)
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedComp = await tx.jobCompletion.update({
        where: { id: completion.id },
        data: {
          seeker_declared_amount: seekerDeclaredAmount,
          seeker_confirmed: true,
          seeker_confirmed_at: new Date(),
          amount_diff: diff,
          amount_diff_pct: diffPct,
          alarm_level: alarmLevel,
          dispute_status: disputeStatus,
          status: finalStatus,
        },
      });

      // İlgili ServiceRequest talebini de tamamlandı olarak güncelle ve doğrudan iş durumunu öğren
      const requestDetails = await tx.serviceRequest.update({
        where: { id: jobId },
        data: {
          status: 'completed',
        },
        select: {
          is_direct: true,
          direct_provider_id: true,
        },
      });

      // Eğer tamamlanan iş doğrudan iş ise, ustanın "Sadık Müşteri" hakkını TRUE yap
      if (requestDetails.is_direct && requestDetails.direct_provider_id) {
        await tx.serviceProvider.update({
          where: { id: requestDetails.direct_provider_id },
          data: {
            open_door_right: true,
          },
        });
      }

      // Uyuşmazlık durumunda otomatik CallTask oluşturma (§15.12.3)
      if (finalStatus === JobCompletionStatus.disputed || disputeStatus === DisputeStatus.open) {
        let priority = 'normal';
        let slaHours = 48; // Normal (Sarı alarm) SLA: 48 Saat

        if (alarmLevel === AlarmLevel.red || !dto.confirmed && seekerDeclaredAmount === 0) {
          priority = 'urgent';
          slaHours = 24; // Acil (Kırmızı alarm veya HA reddetti) SLA: 24 Saat
        }

        const dueAt = new Date();
        dueAt.setHours(dueAt.getHours() + slaHours);

        await tx.callTask.create({
          data: {
            job_completion_id: completion.id,
            customer_id: completion.seeker_id,
            priority: priority as any,
            status: 'pending',
            attempt_count: 0,
            due_at: dueAt,
            notes: `Otomatik uyuşmazlık görevi. Sapma: %${diffPct.toFixed(1)}. Taraf beyanları: HV: ${completion.provider_declared_amount} TL, HA: ${seekerDeclaredAmount} TL.`,
          },
        });
        
        console.log(`[CALL TASK CREATED] Priority: ${priority.toUpperCase()}, SLA: ${slaHours}h, Due: ${dueAt.toISOString()}`);
      }

      return updatedComp;
    });

    // Trigger NPS Survey or Dispute Alert asynchronously after transaction commits
    if (finalStatus === JobCompletionStatus.disputed || disputeStatus === DisputeStatus.open) {
      this.bildirimService.triggerDisputeAlert(completion.id, Number(diffPct), alarmLevel).catch(err => {
        console.error('Failed to trigger dispute alert:', err);
      });
    } else if (alarmLevel === AlarmLevel.none && Number(diffPct) === 0) {
      this.bildirimService.triggerNpsSurvey(completion.id).catch(err => {
        console.error('Failed to trigger NPS survey:', err);
      });
    }

    // 4.5. Referans ödüllendirme tetikleyici (Müşteri işi tamamlayınca)
    await this.referralService.triggerSeekerReward(seekerUserId).catch((err) => {
      console.error('[Referral Seeker Reward Trigger Error]', err);
    });

    // 5. Canlı WebSocket Bildirimi tetikle
    this.chatGateway.emitJobCompletionFinalized(jobId, {
      jobId,
      status: finalStatus,
      alarmLevel,
      amountDiffPct: diffPct,
      providerDeclared: providerAmt,
      seekerDeclared: seekerDeclaredAmount,
      note: dto.note || '',
    });

    return {
      success: true,
      message: finalStatus === JobCompletionStatus.disputed
        ? 'Tutar uyuşmazlığı nedeniyle kalite personeline bildirim yapıldı.'
        : 'İş onayınız başarıyla kaydedildi ve tamamlandı.',
      data: {
        status: finalStatus,
        alarmLevel,
        amountDiffPct: diffPct,
        providerDeclared: providerAmt,
        seekerDeclared: seekerDeclaredAmount,
      },
    };
  }

  /**
   * Geliştirici Simülasyonu: Ustanın işi bitirdiğini simüle eder
   */
  async simulateProviderCompletion(jobId: string, dto: DeclareCompletionDto) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Simülasyonlar sadece geliştirme ortamında çalışabilir.');
    }

    // 1. İşin varlığını doğrula
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Talep bulunamadı.');
    }

    // 2. Mock usta kullanıcısını ve profilini veritabanında tohumla (Yoksa oluştur)
    const mockPhone = '+905329999999';
    const encryptedMockPhone = encryptPhone(mockPhone);
    
    let mockUser = await this.prisma.user.findUnique({
      where: { phone: encryptedMockPhone },
    });

    if (!mockUser) {
      mockUser = await this.prisma.user.create({
        data: {
          phone: encryptedMockPhone,
          phone_masked: maskPhone(mockPhone),
          name: 'Ahmet Usta (Ev Temizliği Uzmanı)',
          role: 'service_provider',
          is_active: true,
          kvkk_consent: true,
        },
      });
    }

    let provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: mockUser.id },
    });

    if (!provider) {
      provider = await this.prisma.serviceProvider.create({
        data: {
          user_id: mockUser.id,
          avg_rating: 4.8,
          is_approved: true,
          approved_at: new Date(),
        },
      });
    }

    // 3. Mock teklif ilişkisini kur (Yoksa oluştur)
    let offer = await this.prisma.offer.findUnique({
      where: {
        job_id_provider_id: {
          job_id: jobId,
          provider_id: provider.id,
        },
      },
    });

    if (!offer) {
      offer = await this.prisma.offer.create({
        data: {
          job_id: jobId,
          provider_id: provider.id,
          price: dto.price,
          message: 'Ev temizliği hizmeti, tüm detaylar dahil usta tarafından simüle edildi.',
          status: 'accepted',
        },
      });
    }

    // 4. Mock kabul edilmiş teklif ilişkisini kur (Yoksa oluştur)
    let acceptedOffer = await this.prisma.acceptedOffer.findFirst({
      where: {
        job_id: jobId,
        provider_id: provider.id,
      },
    });

    if (!acceptedOffer) {
      acceptedOffer = await this.prisma.acceptedOffer.create({
        data: {
          job_id: jobId,
          offer_id: offer.id,
          seeker_id: job.seeker_id,
          provider_id: provider.id,
        },
      });
    }

    // 5. Normal HV tamamlama beyanı tetikleme fonksiyonunu bu mock usta ID'si ile çağır
    return this.declareCompletion(mockUser.id, jobId, dto);
  }
}
