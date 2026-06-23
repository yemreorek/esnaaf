import { Controller, Post, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { DeclareCompletionDto } from './dto/declare-completion.dto';
import { ConfirmCompletionDto } from './dto/confirm-completion.dto';
import { JobCompletionService } from './job-completion.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobCompletionController {
  constructor(private readonly jobCompletionService: JobCompletionService) {}

  /**
   * Hizmet Veren (HV) iş bitiş beyanı
   * POST /api/hizmetveren/jobs/:id/complete
   */
  @Roles('service_provider')
  @Post('hizmetveren/jobs/:id/complete')
  @HttpCode(HttpStatus.OK)
  async declareCompletion(
    @CurrentUser() user: any,
    @Param('id') jobId: string,
    @Body() dto: DeclareCompletionDto,
  ) {
    return this.jobCompletionService.declareCompletion(user.id, jobId, dto);
  }

  /**
   * Hizmet Alan (HA) onay veya itiraz aksiyonu
   * POST /api/musteri/jobs/:id/complete
   */
  @Roles('service_seeker', 'service_provider')
  @Post('musteri/jobs/:id/complete')
  @HttpCode(HttpStatus.OK)
  async confirmCompletion(
    @CurrentUser() user: any,
    @Param('id') jobId: string,
    @Body() dto: ConfirmCompletionDto,
  ) {
    return this.jobCompletionService.confirmCompletion(user.id, jobId, dto);
  }

  /**
   * Geliştirici Simülasyonu: Ustanın işi bitirdiğini simüle eder
   * POST /api/ortak/jobs/:id/simulate-provider-complete
   */
  @Public()
  @Post('ortak/jobs/:id/simulate-provider-complete')
  @HttpCode(HttpStatus.OK)
  async simulateProviderCompletion(
    @Param('id') jobId: string,
    @Body() dto: DeclareCompletionDto,
  ) {
    return this.jobCompletionService.simulateProviderCompletion(jobId, dto);
  }
}
