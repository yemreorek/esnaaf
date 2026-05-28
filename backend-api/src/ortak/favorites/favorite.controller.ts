import { Controller, Post, Delete, Get, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { FavoriteService } from './favorite.service';
import { AddFavoriteDto } from './dto/favorite.dto';

@Controller('ortak/favoriler')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('service_seeker')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  /**
   * Bir hizmet vereni müşterinin favori listesine ekler.
   * POST /api/ortak/favoriler/ekle
   */
  @Post('ekle')
  @HttpCode(HttpStatus.CREATED)
  async addFavorite(@CurrentUser() user: any, @Body() dto: AddFavoriteDto) {
    return this.favoriteService.addFavorite(user.id, dto.provider_id);
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
   * Müşterinin tüm favori ustalarını listeler.
   * GET /api/ortak/favoriler
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getFavorites(@CurrentUser() user: any) {
    return this.favoriteService.getFavorites(user.id);
  }
}
