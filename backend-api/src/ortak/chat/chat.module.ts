import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRetryProcessor } from './chat-retry.processor';
import { GeminiService } from '../../common/gemini/gemini.service';
import { IndustryExpertAgent } from '../agent/industry-expert.agent';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [
    JwtModule.register({}),
    PrismaModule,
    BullModule.registerQueue(
      { name: 'chat-retry' },
      { name: 'talepler-distribution' },
    ),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatRetryProcessor, GeminiService, IndustryExpertAgent],
  exports: [ChatService, ChatGateway, IndustryExpertAgent],
})
export class ChatModule {}

