import { Controller, Post, Get, Put, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { HizmetverenService } from './hizmetveren.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('hizmetveren')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('service_provider')
export class HizmetverenController {
  constructor(private readonly hizmetverenService: HizmetverenService) {}

  /**
   * Hizmet verene atanmış aktif ve teklif verilmemiş işleri listeler
   * GET /api/hizmetveren/gelen-isler
   */
  @Get('gelen-isler')
  @HttpCode(HttpStatus.OK)
  async getGelenIsler(@CurrentUser() user: any) {
    return this.hizmetverenService.getGelenIsler(user.id);
  }

  /**
   * Hizmet verenin mevcut ay içindeki kota durumunu döndürür
   * GET /api/hizmetveren/kota
   */
  @Get('kota')
  @HttpCode(HttpStatus.OK)
  async getQuotaStatus(@CurrentUser() user: any) {
    return this.hizmetverenService.getQuotaStatus(user.id);
  }

  /**
   * Hizmet verenin bir işe teklif vermesini sağlar
   * POST /api/hizmetveren/teklifler
   */
  @Post('teklifler')
  @HttpCode(HttpStatus.CREATED)
  async createOffer(@CurrentUser() user: any, @Body() dto: CreateOfferDto) {
    return this.hizmetverenService.createOffer(user.id, dto);
  }

  /**
   * Hizmet verenin profil detaylarını getirir
   * GET /api/hizmetveren/profil
   */
  @Get('profil')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: any) {
    return this.hizmetverenService.getProfile(user.id);
  }

  /**
   * Hizmet verenin profil konum bilgilerini günceller
   * PUT /api/hizmetveren/profil
   */
  @Put('profil')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.hizmetverenService.updateProfile(user.id, dto);
  }
}
