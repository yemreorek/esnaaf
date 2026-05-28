import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AbonelikController } from './abonelik.controller';
import { WebhookController } from './webhook.controller';
import { AdminTrialController } from './admin-trial.controller';
import { AbonelikService } from './abonelik.service';
import { IyzicoService } from './iyzico.service';
import { AbonelikProcessor } from './abonelik.processor';
import { ReferralModule } from '../../ortak/referral/referral.module';

@Module({
  imports: [
    ConfigModule,
    ReferralModule,
    BullModule.registerQueue({
      name: 'payment-retry',
    }),
  ],
  controllers: [AbonelikController, WebhookController, AdminTrialController],
  providers: [AbonelikService, IyzicoService, AbonelikProcessor],
  exports: [AbonelikService, IyzicoService],
})
export class AbonelikModule {}
