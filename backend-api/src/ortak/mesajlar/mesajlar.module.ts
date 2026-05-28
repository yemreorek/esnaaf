import { Module } from '@nestjs/common';
import { MesajlarController } from './mesajlar.controller';
import { MesajlarService } from './mesajlar.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [MesajlarController],
  providers: [MesajlarService],
  exports: [MesajlarService],
})
export class MesajlarModule {}
