import { Module } from '@nestjs/common';
import { HizmetverenController } from './hizmetveren.controller';
import { HizmetverenService } from './hizmetveren.service';
import { ChatModule } from '../ortak/chat/chat.module';
import { BildirimModule } from '../ortak/bildirimler/bildirim.module';
import { AuthModule } from '../ortak/auth/auth.module';

@Module({
  imports: [ChatModule, BildirimModule, AuthModule],
  controllers: [HizmetverenController],
  providers: [HizmetverenService],
  exports: [HizmetverenService],
})
export class HizmetverenModule {}
