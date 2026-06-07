import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TaleplerController } from './talepler.controller';
import { TekliflerMusteriController } from './teklifler-musteri.controller';
import { TaleplerService } from './talepler.service';
import { TaleplerProcessor } from './talepler.processor';
import { ChatModule } from '../../ortak/chat/chat.module';
import { BildirimModule } from '../../ortak/bildirimler/bildirim.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'talepler-distribution',
    }),
    ChatModule,
    BildirimModule,
  ],
  controllers: [TaleplerController, TekliflerMusteriController],
  providers: [TaleplerService, TaleplerProcessor],
  exports: [TaleplerService],
})
export class TaleplerModule {}
