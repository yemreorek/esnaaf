import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRetryProcessor } from './chat-retry.processor';
import { GeminiService } from '../../common/gemini/gemini.service';
import { TaleplerProcessor } from '../../musteri/talepler/talepler.processor';

@Module({
  imports: [
    JwtModule.register({}),
    BullModule.registerQueue({
      name: 'chat-retry',
    }),
    BullModule.registerQueue({
      name: 'talepler-distribution',
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatRetryProcessor, GeminiService, TaleplerProcessor],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}

