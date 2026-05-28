import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@Controller('ortak/referral')
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private referralService: ReferralService) {}

  /**
   * Giriş yapan kullanıcının kendi referans kodunu alır.
   */
  @Get('kod-al')
  async getMyReferralCode(@CurrentUser() user: any) {
    const code = await this.referralService.getOrCreateReferralCode(user.id);
    return {
      success: true,
      code,
    };
  }

  /**
   * Arkadaşının referans kodunu girerek uygulamak için endpoint.
   */
  @Post('kod-gir')
  async applyReferralCode(
    @CurrentUser() user: any,
    @Body('code') code: string,
  ) {
    const referral = await this.referralService.applyReferralCode(user.id, code);
    return {
      success: true,
      message: 'Referans kodu başarıyla uygulandı.',
      referralId: referral.id,
    };
  }
}
