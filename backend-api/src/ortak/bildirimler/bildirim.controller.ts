import { Controller, Post, Get, Body, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators';
import { FcmTokenKaydetDto, NpsRespondDto } from './dto/bildirim.dto';
import { BildirimService } from './bildirim.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BildirimController {
  constructor(private readonly bildirimService: BildirimService) {}

  /**
   * Post /api/ortak/bildirimler/fcm-token
   * Saves user's FCM push notification token.
   */
  @Post('ortak/bildirimler/fcm-token')
  @HttpCode(HttpStatus.OK)
  async saveFcmToken(@CurrentUser() user: any, @Body() dto: FcmTokenKaydetDto) {
    await this.bildirimService.saveFcmToken(user.id, dto.token);
    return { success: true, message: 'FCM Token başarıyla kaydedildi.' };
  }

  /**
   * Post /api/ortak/nps/respond
   * Records seeker's response to NPS survey.
   */
  @Post('ortak/nps/respond')
  @HttpCode(HttpStatus.OK)
  async recordNpsResponse(@CurrentUser() user: any, @Body() dto: NpsRespondDto) {
    const result = await this.bildirimService.recordNpsResponse(user.id, dto);
    return { success: true, message: 'NPS puanınız başarıyla kaydedildi.', data: result };
  }

  /**
   * Get /api/ortak/bildirimler/gecmis
   * Returns user's in-app notification history.
   */
  @Get('ortak/bildirimler/gecmis')
  async getNotificationHistory(@CurrentUser() user: any) {
    const history = await this.bildirimService.getNotificationHistory(user.id);
    return { success: true, data: history };
  }
}
