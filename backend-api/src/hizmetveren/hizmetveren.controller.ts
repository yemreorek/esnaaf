import { Controller, Post, Get, Put, Body, Param, Query, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ActiveAccountGuard } from '../common/guards/active-account.guard';
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
  @UseGuards(ActiveAccountGuard)
  @HttpCode(HttpStatus.OK)
  async getGelenIsler(@CurrentUser() user: any) {
    return this.hizmetverenService.getGelenIsler(user.id);
  }

  /**
   * Hizmet verenin gelen bir iş fırsatını reddetmesini sağlar
   * POST /api/hizmetveren/gelen-isler/:id/reddet
   */
  @Post('gelen-isler/:id/reddet')
  @UseGuards(ActiveAccountGuard)
  @HttpCode(HttpStatus.OK)
  async rejectJob(
    @CurrentUser() user: any,
    @Param('id') jobId: string,
    @Body('reason') reason: string,
    @Body('details') details?: string,
  ) {
    return this.hizmetverenService.rejectJob(user.id, jobId, reason, details);
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
  @UseGuards(ActiveAccountGuard)
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
   * Hizmet verenin müsaitlik durumunu günceller
   * POST /api/hizmetveren/profil/availability
   */
  @Post('profil/availability')
  @HttpCode(HttpStatus.OK)
  async updateAvailability(@CurrentUser() user: any, @Body('isAvailable') isAvailable: boolean) {
    return this.hizmetverenService.updateAvailability(user.id, isAvailable);
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
   * Hizmet verenin kaybettiği ve iptal edilen işlerini listeler
   * GET /api/hizmetveren/teklifler/kayip-iptal
   */
  @Get('teklifler/kayip-iptal')
  @HttpCode(HttpStatus.OK)
  async getLostAndCancelledJobs(@CurrentUser() user: any) {
    return this.hizmetverenService.getLostAndCancelledJobs(user.id);
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
   * Hizmet verenin kazanılan iş için randevu oluşturmasını veya güncellemesini sağlar
   * POST /api/hizmetveren/kazanilan-isler/:id/randevu
   */
  @Post('kazanilan-isler/:id/randevu')
  @HttpCode(HttpStatus.OK)
  async createOrUpdateAppointment(
    @CurrentUser() user: any,
    @Param('id') acceptedOfferId: string,
    @Body('appointmentAt') appointmentAt: string,
  ) {
    return this.hizmetverenService.createOrUpdateAppointment(user.id, acceptedOfferId, new Date(appointmentAt));
  }

  /**
   * Hizmet verenin kazanılan işi başlatmasını sağlar
   * POST /api/hizmetveren/kazanilan-isler/:id/basla
   */
  @Post('kazanilan-isler/:id/basla')
  @HttpCode(HttpStatus.OK)
  async startJob(
    @CurrentUser() user: any,
    @Param('id') acceptedOfferId: string,
  ) {
    return this.hizmetverenService.startJob(user.id, acceptedOfferId);
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

  /**
   * Hizmet verenin alıcı olduğu okunmamış mesajları listeler
   * GET /api/hizmetveren/okunmamis-mesajlar
   */
  @Get('okunmamis-mesajlar')
  @HttpCode(HttpStatus.OK)
  async getUnreadMessages(@CurrentUser() user: any) {
    return this.hizmetverenService.getUnreadMessages(user.id);
  }

  /**
   * Hizmet verenin kazandığı işi iptal etmesini sağlar
   * POST /api/hizmetveren/kazanilan-isler/:id/iptal
   */
  @Post('kazanilan-isler/:id/iptal')
  @HttpCode(HttpStatus.OK)
  async cancelWonJob(
    @CurrentUser() user: any,
    @Param('id') acceptedOfferId: string,
    @Body('reasonCode') reasonCode: string,
    @Body('reasonText') reasonText?: string,
  ) {
    return this.hizmetverenService.cancelWonJob(user.id, acceptedOfferId, reasonCode, reasonText);
  }

  /**
   * Sadık müşteri için doğrudan iş kartı oluşturur
   * POST /api/hizmetveren/dogrudan-is-karti
   */
  @Post('dogrudan-is-karti')
  @HttpCode(HttpStatus.CREATED)
  async createDirectJobCard(
    @CurrentUser() user: any,
    @Body() body: { seekerId: string; price: number; categorySlug: string; details: string; district: string }
  ) {
    return this.hizmetverenService.createDirectJobCard(user.id, body);
  }

  /**
   * Hizmet verene özel rakip istatistikleri ve bölgesel performans raporu
   * GET /api/hizmetveren/kpi-raporlari
   */
  @Get('kpi-raporlari')
  @HttpCode(HttpStatus.OK)
  async getCompetitorStatsReport(
    @CurrentUser() user: any,
    @Query('period') period?: string
  ) {
    return this.hizmetverenService.getCompetitorStatsReport(user.id, period);
  }
}
