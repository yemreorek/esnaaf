import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { TamamlamaOnayDto } from './dto/tamamlama-musteri.dto';
import { JobCompletionService } from '../../ortak/job-completion/job-completion.service';

@Controller('musteri/tamamlama')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('service_seeker')
export class TamamlamaMusteriController {
  constructor(private readonly jobCompletionService: JobCompletionService) {}

  /**
   * Hizmet Alan (HA) onay veya itiraz aksiyonu
   * POST /api/musteri/tamamlama/onayla
   */
  @Post('onayla')
  @HttpCode(HttpStatus.OK)
  async confirmCompletion(@CurrentUser() user: any, @Body() dto: TamamlamaOnayDto) {
    return this.jobCompletionService.confirmCompletion(user.id, dto.jobId, {
      confirmed: dto.confirmed,
      declaredAmount: dto.declaredAmount,
      note: dto.note,
    });
  }
}
