import { Module } from '@nestjs/common';
import { HizmetverenController } from './hizmetveren.controller';
import { HizmetverenService } from './hizmetveren.service';
import { ChatModule } from '../ortak/chat/chat.module';
import { BildirimModule } from '../ortak/bildirimler/bildirim.module';

@Module({
  imports: [ChatModule, BildirimModule],
  controllers: [HizmetverenController],
  providers: [HizmetverenService],
  exports: [HizmetverenService],
})
export class HizmetverenModule {}
