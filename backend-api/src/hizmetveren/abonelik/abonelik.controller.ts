import { Controller, Post, Get, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser, Public } from '../../common/decorators';
import { AbonelikService } from './abonelik.service';
import { AbonelikBaslatDto, KampanyaDogrulaDto } from './dto/abonelik.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AbonelikController {
  constructor(private readonly abonelikService: AbonelikService) {}

  /**
   * Paketleri Listeleme (PUBLIC)
   * GET /api/ortak/paketler
   */
  @Public()
  @Get('ortak/paketler')
  async getPackages() {
    return this.abonelikService.getPackages();
  }

  /**
   * Abonelik Başlatma
   * POST /api/hizmetveren/abonelik/baslat
   */
  @Roles('service_provider')
  @Post('hizmetveren/abonelik/baslat')
  @HttpCode(HttpStatus.OK)
  async startSubscription(@CurrentUser() user: any, @Body() dto: AbonelikBaslatDto) {
    return this.abonelikService.startSubscription(user.id, dto);
  }

  /**
   * Abonelik İptali (Dönem Sonunda İptal Olacak Şekilde İşaretler)
   * POST /api/hizmetveren/abonelik/iptal
   */
  @Roles('service_provider')
  @Post('hizmetveren/abonelik/iptal')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@CurrentUser() user: any) {
    return this.abonelikService.cancelSubscription(user.id);
  }

  /**
   * Usta Abonelik ve Kota Detayları
   * GET /api/hizmetveren/abonelik
   */
  @Roles('service_provider')
  @Get('hizmetveren/abonelik')
  async getSubscriptionDetails(@CurrentUser() user: any) {
    return this.abonelikService.getSubscriptionDetails(user.id);
  }

  /**
   * Kampanya Kodu Doğrulama
   * POST /api/hizmetveren/kampanya/dogrula
   */
  @Roles('service_provider')
  @Post('hizmetveren/kampanya/dogrula')
  @HttpCode(HttpStatus.OK)
  async validateCampaign(@CurrentUser() user: any, @Body() dto: KampanyaDogrulaDto) {
    // 1. Kullanıcının hizmet veren profilini doğrula
    const provider = await this.abonelikService.getSubscriptionDetails(user.id);
    const validated = await this.abonelikService.validateCampaign(
      user.id, // provider ID will be verified in validation flow
      dto.code,
      dto.packageType
    );

    return {
      success: true,
      message: 'Kampanya kodu geçerlidir.',
      campaign: {
        id: validated.id,
        name: validated.name,
        code: validated.code,
        type: validated.type,
        value: validated.value,
      },
    };
  }
}
