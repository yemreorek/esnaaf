import { Controller, Post, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { TamamlamaBeyanDto } from './dto/tamamlama-hizmetveren.dto';
import { JobCompletionService } from '../../ortak/job-completion/job-completion.service';

@Controller('hizmetveren/tamamlama')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('service_provider')
export class TamamlamaHizmetverenController {
  constructor(private readonly jobCompletionService: JobCompletionService) {}

  /**
   * Hizmet Veren (HV) iş bitiş beyanı ve ücret girişi
   * POST /api/hizmetveren/tamamlama/beyan
   */
  @Post('beyan')
  @HttpCode(HttpStatus.OK)
  async declareCompletion(@CurrentUser() user: any, @Body() dto: TamamlamaBeyanDto) {
    return this.jobCompletionService.declareCompletion(user.id, dto.jobId, {
      price: dto.price,
      note: dto.note,
    });
  }
}
