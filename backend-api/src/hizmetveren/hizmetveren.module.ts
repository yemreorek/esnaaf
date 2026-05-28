import { Module } from '@nestjs/common';
import { HizmetverenController } from './hizmetveren.controller';
import { HizmetverenService } from './hizmetveren.service';
import { ChatModule } from '../ortak/chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [HizmetverenController],
  providers: [HizmetverenService],
  exports: [HizmetverenService],
})
export class HizmetverenModule {}
