import { Module } from '@nestjs/common';
import { TamamlamaMusteriController } from './tamamlama-musteri.controller';
import { JobCompletionModule } from '../../ortak/job-completion/job-completion.module';

@Module({
  imports: [JobCompletionModule],
  controllers: [TamamlamaMusteriController],
})
export class TamamlamaMusteriModule {}
