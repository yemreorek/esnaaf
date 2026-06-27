import { Controller, Post, Get, Put, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, CurrentUser } from '../../common/decorators';
import { CreateTalepDto } from './dto/create-talep.dto';
import { TaleplerService } from './talepler.service';

@Controller('musteri/talepler')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('service_seeker', 'service_provider')
export class TaleplerController {
  constructor(private readonly taleplerService: TaleplerService) {}

  /**
   * Hizmet Alan için yeni talep oluşturur
   * POST /api/musteri/talepler
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: any, @Body() dto: CreateTalepDto) {
    return this.taleplerService.create(user.id, dto);
  }

  /**
   * Müşterinin kendi taleplerini listeler
   * GET /api/musteri/talepler
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@CurrentUser() user: any) {
    return this.taleplerService.findAll(user.id);
  }

  /**
   * Talebin ayrıntılarını ve gelen teklifleri gösterir
   * GET /api/musteri/talepler/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@CurrentUser() user: any, @Param('id') jobId: string) {
    return this.taleplerService.findOne(user.id, jobId);
  }

  /**
   * Talebi iptal eder ve bekleyen tekliflerini cancel yapar
   * PUT /api/musteri/talepler/:id/iptal
   */
  @Put(':id/iptal')
  @HttpCode(HttpStatus.OK)
  async cancel(@CurrentUser() user: any, @Param('id') jobId: string) {
    return this.taleplerService.cancel(user.id, jobId);
  }

  /**
   * Talebi aynı bilgilerle tekrar yayına alır (yeni talep gibi)
   * POST /api/musteri/talepler/:id/tekrar-yayinla
   */
  @Post(':id/tekrar-yayinla')
  @HttpCode(HttpStatus.CREATED)
  async republish(@CurrentUser() user: any, @Param('id') jobId: string) {
    return this.taleplerService.republish(user.id, jobId);
  }
}
