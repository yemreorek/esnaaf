import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import * as Bull from 'bull';
import { AbonelikService } from './abonelik.service';

@Processor('payment-retry')
export class AbonelikProcessor {
  private readonly logger = new Logger(AbonelikProcessor.name);

  constructor(private readonly abonelikService: AbonelikService) {}

  @Process('payment-retry-job')
  async handlePaymentRetry(job: Bull.Job<any>) {
    const { providerId, subscriptionId, attemptCount } = job.data;
    this.logger.log(`[PAYMENT RETRY JOB] Attempting failed payment retry ${attemptCount} for Provider ${providerId}`);

    try {
      // Burada gerçekte iyzico token ile tekrar çekim yapılmaya çalışılır.
      // Simülasyon gereği direkt başarısızlık akışını tetikliyoruz
      await this.abonelikService.handleFailedPayment(providerId, subscriptionId, attemptCount);
    } catch (error) {
      this.logger.error(`[PAYMENT RETRY JOB ERROR] Failed to process payment retry job: ${error.message}`);
      throw error;
    }
  }
}
