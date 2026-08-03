import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { ChatService } from './chat.service';
import { FlowEngineService } from './flow-engine.service';
import { LeadFormService } from './lead-form.service';
import { AiConsultantService } from './ai-consultant.service';
import { MarketPriceAggregatorService } from './market-price-aggregator.service';
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
  providers: [
    ChatService,
    FlowEngineService,
    LeadFormService,
    AiConsultantService,
    MarketPriceAggregatorService,
    ChatGateway,
    ChatRetryProcessor,
    GeminiService,
    IndustryExpertAgent,
  ],
  exports: [ChatService, FlowEngineService, LeadFormService, AiConsultantService, MarketPriceAggregatorService, ChatGateway, IndustryExpertAgent],
})
export class ChatModule {}
