import { Controller, Post, Delete, Param, UseGuards, HttpStatus, HttpCode, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { AbonelikService } from './abonelik.service';

@Controller('admin/providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminTrialController {
  constructor(private readonly abonelikService: AbonelikService) {}

  /**
   * Hizmet Verene (HV) Admin Trial Tanımlama (14 Günlük Standart Paket)
   * POST /api/admin/providers/:id/trial
   */
  @Roles('admin')
  @Post(':id/trial')
  @HttpCode(HttpStatus.OK)
  async grantTrial(
    @Param('id') providerId: string,
    @Body('note') note?: string,
  ) {
    return this.abonelikService.adminGrantTrial(providerId, note);
  }

  /**
   * Hizmet Verene Ait Aktif Trial Paketini İptal Etme
   * DELETE /api/admin/providers/:id/trial
   */
  @Roles('admin')
  @Delete(':id/trial')
  @HttpCode(HttpStatus.OK)
  async cancelTrial(@Param('id') providerId: string) {
    return this.abonelikService.adminCancelTrial(providerId);
  }
}
