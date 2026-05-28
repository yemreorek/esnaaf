import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BildirimController } from './bildirim.controller';
import { BildirimService } from './bildirim.service';
import { NpsSurveyProcessor, DisputeAlertProcessor } from './bildirim.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'nps-survey',
    }),
    BullModule.registerQueue({
      name: 'dispute-alert',
    }),
  ],
  controllers: [BildirimController],
  providers: [BildirimService, NpsSurveyProcessor, DisputeAlertProcessor],
  exports: [BildirimService, BullModule],
})
export class BildirimModule {}
