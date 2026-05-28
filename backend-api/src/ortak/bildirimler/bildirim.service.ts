import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BILDIRIM_SABLONLARI, formatMessage } from './bildirim-sablonlari';
import { NpsRespondDto } from './dto/bildirim.dto';
import { NotifChannel, NpsGroup, NotifStatus } from '@prisma/client';

@Injectable()
export class BildirimService {
  private readonly logger = new Logger(BildirimService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('nps-survey') private npsSurveyQueue: Bull.Queue,
    @InjectQueue('dispute-alert') private disputeAlertQueue: Bull.Queue,
  ) {}

  /**
   * Saves FCM token for the user
   */
  async saveFcmToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { fcm_token: token },
    });
    this.logger.log(`FCM token saved for user ${userId}`);
  }

  /**
   * Gets notification history for a user
   */
  async getNotificationHistory(userId: string) {
    return this.prisma.notificationLog.findMany({
      where: { user_id: userId },
      orderBy: { sent_at: 'desc' },
      take: 50,
    });
  }

  /**
   * Formats and logs a notification, simulating real delivery channels.
   */
  async sendNotification(userId: string, eventCode: string, payload: Record<string, any> = {}): Promise<void> {
    const template = BILDIRIM_SABLONLARI[eventCode];
    if (!template) {
      this.logger.warn(`Notification template not found for event code: ${eventCode}`);
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notification_preference: true },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found, cannot send notification.`);
      return;
    }

    const pref = user.notification_preference;

    for (const channel of template.channels) {
      // Check preferences
      if (pref) {
        if (channel === NotifChannel.push && !pref.push_enabled) continue;
        if (channel === NotifChannel.sms && !pref.sms_enabled) continue;
        // email is standard or enabled via marketing_email, etc.
      }

      const title = formatMessage(template.title, payload);
      const body = formatMessage(template.body, payload);

      // Simulate sending
      this.logger.log(`[Bildirim Gönderiliyor] [${eventCode}] [Kanal: ${channel}] Alıcı: ${user.name || user.phone} -> Başlık: "${title}", Gövde: "${body}"`);

      await this.prisma.notificationLog.create({
        data: {
          user_id: userId,
          event_code: eventCode,
          channel: channel as NotifChannel,
          status: NotifStatus.sent,
          payload: {
            title,
            body,
            data: payload,
          },
          sent_at: new Date(),
          delivered_at: new Date(),
        },
      });
    }
  }

  /**
   * Triggers delayed NPS Platform Survey (30 mins delay)
   */
  async triggerNpsSurvey(jobCompletionId: string): Promise<void> {
    // Add 30-min delayed job to queue
    const delay = Number(process.env.NPS_SURVEY_DELAY_MS) || 30 * 60 * 1000; // 30 minutes
    await this.npsSurveyQueue.add(
      'survey-trigger',
      { jobCompletionId },
      { delay },
    );
    this.logger.log(`NPS Platform survey scheduled for jobCompletion ${jobCompletionId} in ${delay}ms`);
  }

  /**
   * Records NPS response and runs downstream workflows
   */
  async recordNpsResponse(seekerId: string, dto: NpsRespondDto): Promise<any> {
    const jobCompletion = await this.prisma.jobCompletion.findUnique({
      where: { id: dto.jobCompletionId },
      include: {
        job: true,
      },
    });

    if (!jobCompletion) {
      throw new NotFoundException(`Job completion not found: ${dto.jobCompletionId}`);
    }

    const score = dto.score;
    let group: NpsGroup = NpsGroup.passive;
    if (score <= 3) {
      group = NpsGroup.detractor;
    } else if (score >= 7) {
      group = NpsGroup.promoter;
    }

    // Save NPS Response
    const response = await this.prisma.npsResponse.create({
      data: {
        job_completion_id: dto.jobCompletionId,
        seeker_id: seekerId,
        provider_id: jobCompletion.provider_id,
        category_id: jobCompletion.job.category_id,
        score,
        group,
        follow_up_text: dto.followUpText,
        channel: 'web',
        responded_at: new Date(),
      },
    });

    this.logger.log(`NPS Response saved: Seeker ${seekerId}, Provider ${jobCompletion.provider_id}, Score: ${score} (${group})`);

    // 0-3 Detractor
    if (group === NpsGroup.detractor) {
      // 1. Kalite personeline anlık alarm (Queue dispute-alert immediate)
      await this.disputeAlertQueue.add('detractor-alert', {
        jobCompletionId: dto.jobCompletionId,
        seekerId,
        providerId: jobCompletion.provider_id,
        score,
      });

      // 2. 10-dakika sonra HA-09 takip sorusu planla
      const followUpDelay = Number(process.env.HA09_FOLLOW_UP_DELAY_MS) || 10 * 60 * 1000;
      await this.npsSurveyQueue.add(
        'follow-up-trigger',
        { seekerId, jobCompletionId: dto.jobCompletionId },
        { delay: followUpDelay },
      );
      this.logger.log(`Detractor follow-up scheduled for Seeker ${seekerId} in ${followUpDelay}ms`);

      // 3. Eşşik Alarmı: Aynı HV son 30 günde 3+ detractor aldı mı?
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const detractorCount = await this.prisma.npsResponse.count({
        where: {
          provider_id: jobCompletion.provider_id,
          group: NpsGroup.detractor,
          created_at: { gte: thirtyDaysAgo },
        },
      });

      if (detractorCount >= 3) {
        // Fetch HV details
        const hv = await this.prisma.serviceProvider.findUnique({
          where: { id: jobCompletion.provider_id },
          include: { user: true },
        });

        // Trigger AD-07 to admin/team_leader staff
        const teamLeaders = await this.prisma.staff.findMany({
          where: { role: 'team_leader', is_active: true },
        });

        for (const leader of teamLeaders) {
          this.logger.log(`[AD-07] Acil Detraktör Alarmı! Usta: ${hv?.user.name || hv?.id} son 30 günde ${detractorCount} adet detraktör puanı aldı. Alıcı: ${leader.email}`);
          // Send notification simulation
          await this.prisma.notificationLog.create({
            data: {
              user_id: hv?.user_id || seekerId, // log to hv user or fallback
              event_code: 'AD-07',
              channel: NotifChannel.email,
              status: NotifStatus.sent,
              payload: {
                title: '[ACİL] Çoklu Detraktör Alarmı',
                body: `Hizmet Veren (${hv?.user.name || hv?.id}) son 30 günde 3+ detraktör puanı almıştır. Acil inceleme gereklidir!`,
                data: { provider_id: jobCompletion.provider_id, count: detractorCount },
              },
              sent_at: new Date(),
            },
          });
        }
      }
    }

    // 7-10 Promoter
    if (group === NpsGroup.promoter) {
      // 2 saat sonra HA-10 değerlendirme daveti
      const inviteDelay = Number(process.env.HA10_INVITE_DELAY_MS) || 2 * 60 * 60 * 1000;
      await this.npsSurveyQueue.add(
        'review-invite-trigger',
        {
          seekerId,
          providerId: jobCompletion.provider_id,
          jobCompletionId: dto.jobCompletionId,
        },
        { delay: inviteDelay },
      );
      this.logger.log(`Review invitation (HA-10) scheduled for Seeker ${seekerId} in ${inviteDelay}ms`);
    }

    return response;
  }

  /**
   * Triggers immediate dispute alert in case of job completion dispute/amount deviation
   */
  async triggerDisputeAlert(jobCompletionId: string, diffPct: number, alarmLevel: string): Promise<void> {
    await this.disputeAlertQueue.add('dispute-alert', {
      jobCompletionId,
      diffPct,
      alarmLevel,
    });
    this.logger.log(`Dispute alert queued for jobCompletion ${jobCompletionId} with alarm level ${alarmLevel}`);
  }
}
