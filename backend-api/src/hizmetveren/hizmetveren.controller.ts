import { Controller, Post, Get, Put, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { HizmetverenService } from './hizmetveren.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDocumentsDto } from './dto/update-documents.dto';

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

  /**
   * Hizmet verenin kimlik ve vergi levhası belgelerini günceller
   * PUT /api/hizmetveren/profil/belgeler
   */
  @Put('profil/belgeler')
  @HttpCode(HttpStatus.OK)
  async updateDocuments(@CurrentUser() user: any, @Body() dto: UpdateDocumentsDto) {
    return this.hizmetverenService.updateDocuments(user.id, dto);
  }

  /**
   * Hizmet verenin tüm tekliflerini listeler
   * GET /api/hizmetveren/teklifler
   */
  @Get('teklifler')
  @HttpCode(HttpStatus.OK)
  async getOffers(@CurrentUser() user: any) {
    return this.hizmetverenService.getOffers(user.id);
  }

  /**
   * Hizmet verenin kazandığı işleri listeler
   * GET /api/hizmetveren/kazanilan-isler
   */
  @Get('kazanilan-isler')
  @HttpCode(HttpStatus.OK)
  async getWonJobs(@CurrentUser() user: any) {
    return this.hizmetverenService.getWonJobs(user.id);
  }

  /**
   * Hizmet verenin tamamladığı işleri listeler
   * GET /api/hizmetveren/tamamlanan-isler
   */
  @Get('tamamlanan-isler')
  @HttpCode(HttpStatus.OK)
  async getCompletedJobs(@CurrentUser() user: any) {
    return this.hizmetverenService.getCompletedJobs(user.id);
  }

  /**
   * Hizmet verene yapılan yorumları listeler
   * GET /api/hizmetveren/yorumlar
   */
  @Get('yorumlar')
  @HttpCode(HttpStatus.OK)
  async getReviews(@CurrentUser() user: any) {
    return this.hizmetverenService.getReviews(user.id);
  }

  /**
   * Hizmet verene ait uyuşmazlıklı işleri listeler
   * GET /api/hizmetveren/uyusmazliklar
   */
  @Get('uyusmazliklar')
  @HttpCode(HttpStatus.OK)
  async getDisputes(@CurrentUser() user: any) {
    return this.hizmetverenService.getDisputes(user.id);
  }
}
