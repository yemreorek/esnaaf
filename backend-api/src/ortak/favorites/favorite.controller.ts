import { Controller, Post, Delete, Get, Body, Param, UseGuards, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { FavoriteService } from './favorite.service';
import { AddFavoriteDto } from './dto/favorite.dto';

@Controller('ortak/favoriler')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('service_seeker', 'service_provider')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  /**
   * Bir hizmet vereni müşterinin favori listesine ekler (Klasik yöntem).
   * POST /api/ortak/favoriler/ekle
   */
  @Post('ekle')
  @HttpCode(HttpStatus.CREATED)
  async addFavorite(@CurrentUser() user: any, @Body() dto: AddFavoriteDto) {
    const providerId = dto.provider_id || dto.providerId;
    if (!providerId) {
      throw new BadRequestException('Hizmet veren ID alanı boş bırakılamaz.');
    }
    return this.favoriteService.addFavorite(user.id, providerId);
  }

  /**
   * Bir hizmet vereni favori listesinden çıkarır.
   * DELETE /api/ortak/favoriler/sil/:providerId
   */
  @Delete('sil/:providerId')
  @HttpCode(HttpStatus.OK)
  async removeFavorite(@CurrentUser() user: any, @Param('providerId') providerId: string) {
    await this.favoriteService.removeFavorite(user.id, providerId);
    return {
      success: true,
      message: 'Hizmet veren favorilerinizden kaldırıldı.',
    };
  }

  /**
   * Müşterinin tüm favori ustalarını listeler (approved = true olanlar).
   * GET /api/ortak/favoriler
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getFavorites(@CurrentUser() user: any) {
    return this.favoriteService.getFavorites(user.id);
  }

  /**
   * Kendi Esnaaf ID'sini döndürür.
   * GET /api/ortak/favoriler/profil-esnaaf-id
   */
  @Get('profil-esnaaf-id')
  @HttpCode(HttpStatus.OK)
  async getProfileEsnaafId(@CurrentUser() user: any) {
    const esnaafId = await this.favoriteService.getProfileEsnaafId(user.id);
    return { esnaaf_id: esnaafId };
  }

  /**
   * Esnaaf ID ile kullanıcı arama
   * GET /api/ortak/favoriler/esnaaf-ara/:esnaafId
   */
  @Get('esnaaf-ara/:esnaafId')
  @HttpCode(HttpStatus.OK)
  async searchByEsnaafId(@CurrentUser() user: any, @Param('esnaafId') esnaafId: string) {
    return this.favoriteService.searchByEsnaafId(user.id, user.role, esnaafId);
  }

  /**
   * Esnaaf ID ile sadık müşteri / favori usta ekleme
   * POST /api/ortak/favoriler/esnaaf-ekle
   */
  @Post('esnaaf-ekle')
  @HttpCode(HttpStatus.OK)
  async addEsnaafFavorite(@CurrentUser() user: any, @Body() body: { esnaaf_id: string }) {
    return this.favoriteService.addEsnaafFavorite(user.id, user.role, body.esnaaf_id);
  }

  /**
   * Müşterinin onay bekleyen sadık müşteri bağlantı istekleri
   * GET /api/ortak/favoriler/onay-bekleyenler
   */
  @Get('onay-bekleyenler')
  @HttpCode(HttpStatus.OK)
  async getPendingRequests(@CurrentUser() user: any) {
    return this.favoriteService.getPendingRequests(user.id);
  }

  /**
   * Sadık müşteri bağlantı isteğini onaylama
   * POST /api/ortak/favoriler/onayla/:id
   */
  @Post('onayla/:id')
  @HttpCode(HttpStatus.OK)
  async approveRequest(@CurrentUser() user: any, @Param('id') favoriteId: string) {
    return this.favoriteService.approveRequest(user.id, favoriteId);
  }

  /**
   * Sadık müşteri bağlantı isteğini reddetme
   * POST /api/ortak/favoriler/reddet/:id
   */
  @Post('reddet/:id')
  @HttpCode(HttpStatus.OK)
  async rejectRequest(@CurrentUser() user: any, @Param('id') favoriteId: string) {
    return this.favoriteService.rejectRequest(user.id, favoriteId);
  }

  /**
   * Ustanın sadık müşterilerini listelemesi
   * GET /api/ortak/favoriler/musterilerim
   */
  @Get('musterilerim')
  @HttpCode(HttpStatus.OK)
  async getMyCustomers(@CurrentUser() user: any) {
    return this.favoriteService.getMyCustomers(user.id);
  }
}

