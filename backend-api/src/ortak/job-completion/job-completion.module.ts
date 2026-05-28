import { Module } from '@nestjs/common';
import { JobCompletionService } from './job-completion.service';
import { JobCompletionController } from './job-completion.controller';
import { ChatModule } from '../chat/chat.module';
import { BildirimModule } from '../bildirimler/bildirim.module';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [
    ChatModule,
    BildirimModule,
    ReferralModule,
  ],
  controllers: [JobCompletionController],
  providers: [JobCompletionService],
  exports: [JobCompletionService],
})
export class JobCompletionModule {}
