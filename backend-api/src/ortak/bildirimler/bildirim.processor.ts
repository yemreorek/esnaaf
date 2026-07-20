import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import * as Bull from 'bull';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BildirimService } from './bildirim.service';

@Processor('nps-survey')
@Injectable()
export class NpsSurveyProcessor {
  private readonly logger = new Logger(NpsSurveyProcessor.name);

  constructor(
    private prisma: PrismaService,
    private bildirimService: BildirimService,
  ) {}

  @Process('survey-trigger')
  async handleSurveyTrigger(job: Bull.Job<{ jobCompletionId: string }>) {
    const { jobCompletionId } = job.data;
    this.logger.log(`[BullMQ Processor] NPS Survey Trigger. Job Completion: ${jobCompletionId}`);

    const completion = await this.prisma.jobCompletion.findUnique({
      where: { id: jobCompletionId },
      include: { provider: { include: { user: true } } },
    });

    if (!completion) {
      this.logger.error(`Job completion not found for NPS trigger: ${jobCompletionId}`);
      return;
    }

    // Trigger HA-08 for Seeker
    let hvName08 = 'Hizmet Veren';
    if (completion.provider) {
      let onboardingData: any = {};
      if (completion.provider.description && completion.provider.description.startsWith('{')) {
        try {
          onboardingData = JSON.parse(completion.provider.description);
        } catch (e) {}
      }
      hvName08 = onboardingData.companyName || completion.provider.user.name || 'Hizmet Veren';
    }
    await this.bildirimService.sendNotification(completion.seeker_id, 'HA-08', {
      hv_name: hvName08,
    });
  }

  @Process('follow-up-trigger')
  async handleFollowUpTrigger(job: Bull.Job<{ seekerId: string; jobCompletionId: string }>) {
    const { seekerId } = job.data;
    this.logger.log(`[BullMQ Processor] NPS Detractor Follow-up. Seeker: ${seekerId}`);

    // Trigger HA-09 for Seeker
    await this.bildirimService.sendNotification(seekerId, 'HA-09');
  }

  @Process('review-invite-trigger')
  async handleReviewInviteTrigger(job: Bull.Job<{ seekerId: string; providerId: string; jobCompletionId: string }>) {
    const { seekerId, providerId } = job.data;
    this.logger.log(`[BullMQ Processor] Review Invite. Seeker: ${seekerId}, Provider: ${providerId}`);

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { user: true },
    });

    if (!provider) {
      this.logger.error(`Provider not found for review invitation: ${providerId}`);
      return;
    }

    // Trigger HA-10 for Seeker
    let hvName10 = 'Hizmet Veren';
    if (provider) {
      let onboardingData: any = {};
      if (provider.description && provider.description.startsWith('{')) {
        try {
          onboardingData = JSON.parse(provider.description);
        } catch (e) {}
      }
      hvName10 = onboardingData.companyName || provider.user.name || 'Hizmet Veren';
    }
    await this.bildirimService.sendNotification(seekerId, 'HA-10', {
      hv_name: hvName10,
    });
  }
}

@Processor('dispute-alert')
@Injectable()
export class DisputeAlertProcessor {
  private readonly logger = new Logger(DisputeAlertProcessor.name);

  constructor(
    private prisma: PrismaService,
    private bildirimService: BildirimService,
  ) {}

  @Process('detractor-alert')
  async handleDetractorAlert(job: Bull.Job<{ jobCompletionId: string; seekerId: string; providerId: string; score: number }>) {
    const { jobCompletionId, providerId, score } = job.data;
    this.logger.log(`[BullMQ Processor] Detractor Alarm. Score: ${score}, Provider: ${providerId}, JobCompletion: ${jobCompletionId}`);

    // Fetch quality staff and trigger simulation
    const staff = await this.prisma.staff.findMany({
      where: { role: 'quality_staff', is_active: true },
    });

    for (const member of staff) {
      this.logger.log(`[Kalite Personeli Bildirimi] Alıcı: ${member.email} -> Detraktör Uyarısı (Usta ID: ${providerId}, NPS Skor: ${score})`);
    }
  }

  @Process('dispute-alert')
  async handleDisputeAlert(job: Bull.Job<{ jobCompletionId: string; diffPct: number; alarmLevel: string }>) {
    const { jobCompletionId, diffPct, alarmLevel } = job.data;
    this.logger.log(`[BullMQ Processor] Dispute Alarm. Job Completion: ${jobCompletionId}, Diff %: ${diffPct.toFixed(1)}, Level: ${alarmLevel}`);

    const completion = await this.prisma.jobCompletion.findUnique({
      where: { id: jobCompletionId },
    });

    if (!completion) {
      this.logger.error(`Job completion not found for dispute alert: ${jobCompletionId}`);
      return;
    }

    // Create call task automatically for dispute flow
    // SLA: Urgent (Yellow/Red) -> 24 hours, Normal (Info) -> 48 hours
    const isUrgent = alarmLevel === 'yellow' || alarmLevel === 'red';
    const slaHours = isUrgent ? 24 : 48;
    const dueAt = new Date();
    dueAt.setHours(dueAt.getHours() + slaHours);

    await this.prisma.callTask.create({
      data: {
        job_completion_id: jobCompletionId,
        customer_id: completion.seeker_id,
        priority: isUrgent ? 'urgent' : 'normal',
        status: 'pending',
        due_at: dueAt,
        notes: `Sapma: %${diffPct.toFixed(1)} (${alarmLevel.toUpperCase()} Seviye Alarm)`,
      },
    });

    this.logger.log(`Call Task (SLA: ${slaHours}h) created for JobCompletion ${jobCompletionId}. Priority: ${isUrgent ? 'urgent' : 'normal'}`);
  }
}
