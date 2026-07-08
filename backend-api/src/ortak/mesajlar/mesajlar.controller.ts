import { Controller, Post, Get, Put, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ActiveAccountGuard } from '../../common/guards/active-account.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { MesajlarService } from './mesajlar.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('ortak/mesajlar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('service_seeker', 'service_provider')
export class MesajlarController {
  constructor(private readonly mesajlarService: MesajlarService) {}

  /**
   * Sohbet odasına yeni bir mesaj gönderir
   * POST /api/ortak/mesajlar
   */
  @Post()
  @UseGuards(ActiveAccountGuard)
  @HttpCode(HttpStatus.CREATED)
  async createMessage(@CurrentUser() user: any, @Body() dto: CreateMessageDto) {
    return this.mesajlarService.createMessage(user.id, dto);
  }

  /**
   * Belirli bir iş ve teklif için tüm mesaj geçmişini çeker
   * GET /api/ortak/mesajlar/:talepId/:teklifId
   */
  @Get(':talepId/:teklifId')
  @HttpCode(HttpStatus.OK)
  async getMessages(
    @CurrentUser() user: any,
    @Param('talepId') talepId: string,
    @Param('teklifId') teklifId: string,
  ) {
    return this.mesajlarService.getMessages(user.id, talepId, teklifId);
  }

  /**
   * Gelen bir mesajı okundu olarak işaretler
   * PUT /api/ortak/mesajlar/:id/okundu
   */
  @Put(':id/okundu')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@CurrentUser() user: any, @Param('id') messageId: string) {
    return this.mesajlarService.markAsRead(user.id, messageId);
  }
}
