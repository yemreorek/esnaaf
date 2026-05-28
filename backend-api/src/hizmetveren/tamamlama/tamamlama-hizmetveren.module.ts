import { Module } from '@nestjs/common';
import { TamamlamaHizmetverenController } from './tamamlama-hizmetveren.controller';
import { JobCompletionModule } from '../../ortak/job-completion/job-completion.module';

@Module({
  imports: [JobCompletionModule],
  controllers: [TamamlamaHizmetverenController],
})
export class TamamlamaHizmetverenModule {}
