import { Controller, Post, Body, Param, UseGuards, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { TaleplerService } from './talepler.service';

@Controller('musteri/teklifler')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('service_seeker')
export class TekliflerMusteriController {
  constructor(private readonly taleplerService: TaleplerService) {}

  /**
   * Müşteri bir usta teklifini kabul eder, telefonları açar
   * POST /api/musteri/teklifler/:id/kabul
   */
  @Post(':id/kabul')
  @HttpCode(HttpStatus.OK)
  async acceptOffer(
    @CurrentUser() user: any,
    @Param('id') offerId: string,
    @Body() body: { consent: boolean },
  ) {
    if (!body || body.consent === undefined) {
      throw new BadRequestException('Onay (consent) alanı zorunludur.');
    }
    return this.taleplerService.acceptOffer(user.id, offerId, body.consent);
  }
}
