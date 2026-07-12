import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, HttpStatus, HttpCode, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
import { AdminService } from './admin.service';
import { 
  UserQueryDto, 
  BanUserDto, 
  RejectProviderDto, 
  CreateStaffDto, 
  ResolveDisputeDto, 
  CallTaskResultDto,
  SaveAbTestConfigDto,
  CreateCampaignDto
} from './dto/admin-users.dto';
import { SkipThrottle } from '@nestjs/throttler';

import { GraphSeederService, GraphKnowledgeBase } from './graph-seeder.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin', 'quality_staff', 'finance_staff', 'ops_staff', 'sales_staff', 'executive')
@SkipThrottle()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly graphSeederService: GraphSeederService,
  ) {}

  /**
   * Yeni Sektör Şeması Yükle (.json)
   * POST /api/admin/graph/upload-json
   */
  @Post('graph/upload-json')
  @UseInterceptors(FileInterceptor('file'))
  @Roles('admin', 'super_admin') // Sadece yetkili adminler
  async uploadGraphJson(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Dosya bulunamadı.');
    }

    try {
      const fileContent = file.buffer.toString('utf-8');
      const parsed: GraphKnowledgeBase = JSON.parse(fileContent);
      return await this.graphSeederService.ingestGraphConfig(parsed, file.originalname);
    } catch (error: any) {
      throw new BadRequestException(`Geçersiz JSON formatı veya yükleme hatası: ${error.message}`);
    }
  }

  /**
   * JSON Yükleme Geçmişini Getir
   * GET /api/admin/graph/upload-logs
   */
  @Get('graph/upload-logs')
  @Roles('admin', 'super_admin')
  async getUploadLogs() {
    return await this.adminService.getGraphUploadLogs();
  }

  /**
   * Giriş yapan admin personelin profil ve yetki bilgilerini getirir
   * GET /api/admin/me
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getAdminProfile(@CurrentUser() user: any) {
    return this.adminService.getAdminProfile(user.email);
  }

  /**
   * Admin paneli ana sayfa metrikleri
   * GET /api/admin/dashboard/stats
   */
  @Get('dashboard/stats')
  @HttpCode(HttpStatus.OK)
  async getDashboardStats(@CurrentUser() user: any) {
    return this.adminService.getDashboardStats(user.email);
  }

  /**
   * Kullanıcı listesi filtreleme ve arama
   * GET /api/admin/users
   */
  @Get('users')
  @HttpCode(HttpStatus.OK)
  async getUsers(@Query() query: UserQueryDto, @CurrentUser() user: any) {
    return this.adminService.getUsers(query, user.email);
  }

  /**
   * Kullanıcı listesi filtreleme ve arama (Türkçe Takma Ad Rota)
   * GET /api/admin/kullanicilar
   */
  @Get('kullanicilar')
  @HttpCode(HttpStatus.OK)
  async getKullanicilar(@Query() query: UserQueryDto, @CurrentUser() user: any) {
    return this.adminService.getUsers(query, user.email);
  }

  /**
   * Kullanıcı detay sayfası
   * GET /api/admin/users/:id
   */
  @Get('users/:id')
  @HttpCode(HttpStatus.OK)
  async getUserDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.getUserDetail(id, user.email);
  }

  /**
   * Kullanıcı banlama işlemi
   * POST /api/admin/users/:id/ban
   */
  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  async banUser(@Param('id') id: string, @Body() dto: BanUserDto, @CurrentUser() user: any) {
    return this.adminService.banUser(id, dto, user.email);
  }

  /**
   * Kullanıcı aktif/pasif durumunu değiştirme
   * POST /api/admin/users/:id/toggle-active
   */
  @Post('users/:id/toggle-active')
  @HttpCode(HttpStatus.OK)
  async toggleUserActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.toggleUserActive(id, user.email);
  }

  /**
   * Kullanıcıyı KVKK gereği zorla ve geri döndürülemez biçimde silme (anonimleştirme)
   * POST /api/admin/users/:id/kvkk-delete
   */
  @Post('users/:id/kvkk-delete')
  @HttpCode(HttpStatus.OK)
  async kvkkForceDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.kvkkForceDelete(id, user.email);
  }

  /**
   * Kullanıcı paneli ön izleme (Login As / Impersonate) token üretimi
   * POST /api/admin/users/:id/impersonate
   */
  @Post('users/:id/impersonate')
  @HttpCode(HttpStatus.OK)
  async impersonateUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.impersonateUser(id, user.email);
  }

  /**
   * Onay bekleyen hizmet verenler listesi (onay kuyruğu - eski rota)
   * GET /api/admin/hizmetveren/onay-kuyrugu
   */
  @Get('hizmetveren/onay-kuyrugu')
  @HttpCode(HttpStatus.OK)
  async getApprovalQueueLegacy(@CurrentUser() user: any) {
    return this.adminService.getApprovalQueue(user.email);
  }

  /**
   * Onay bekleyen hizmet verenler listesi (onay kuyruğu - yeni rota)
   * GET /api/admin/providers/pending
   */
  @Get('providers/pending')
  @HttpCode(HttpStatus.OK)
  async getApprovalQueue(@CurrentUser() user: any) {
    return this.adminService.getApprovalQueue(user.email);
  }

  /**
   * Hizmet veren başvurusunu onaylama (eski rota)
   * POST /api/admin/hizmetveren/:id/onay
   */
  @Post('hizmetveren/:id/onay')
  @HttpCode(HttpStatus.OK)
  async approveProviderLegacy(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.approveProvider(id, user.email);
  }

  /**
   * Hizmet veren başvurusunu onaylama (yeni rota)
   * PUT /api/admin/providers/:id/approve
   */
  @Put('providers/:id/approve')
  @HttpCode(HttpStatus.OK)
  async approveProvider(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.approveProvider(id, user.email);
  }

  /**
   * Hizmet veren başvurusunu sebepli reddetme (eski rota)
   * POST /api/admin/hizmetveren/:id/red
   */
  @Post('hizmetveren/:id/red')
  @HttpCode(HttpStatus.OK)
  async rejectProviderLegacy(@Param('id') id: string, @Body() dto: RejectProviderDto, @CurrentUser() user: any) {
    return this.adminService.rejectProvider(id, dto, user.email);
  }

  /**
   * Hizmet veren başvurusunu sebepli reddetme (yeni rota)
   * PUT /api/admin/providers/:id/reject
   */
  @Put('providers/:id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectProvider(@Param('id') id: string, @Body() dto: RejectProviderDto, @CurrentUser() user: any) {
    return this.adminService.rejectProvider(id, dto, user.email);
  }

  /**
   * Çözüm bekleyen uyuşmazlık alarmları kuyruğu
   * GET /api/admin/disputes
   */
  @Get('disputes')
  @HttpCode(HttpStatus.OK)
  async getDisputes(@CurrentUser() user: any) {
    return this.adminService.getDisputes(user.email);
  }

  /**
   * Uyuşmazlığı karara bağlama
   * PUT /api/admin/disputes/:id/resolve
   */
  @Put('disputes/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.resolveDispute(user.email, id, dto);
  }

  /**
   * Personel listesi
   * GET /api/admin/staff
   */
  @Get('staff')
  @HttpCode(HttpStatus.OK)
  async getStaffList(@CurrentUser() user: any) {
    return this.adminService.getStaffList(user.email);
  }

  /**
   * Personel ekleme / Onboarding daveti
   * POST /api/admin/staff
   */
  @Post('staff')
  @HttpCode(HttpStatus.OK)
  async createStaff(@Body() dto: CreateStaffDto, @CurrentUser() user: any) {
    return this.adminService.createStaff(user.email, dto);
  }

  /**
   * Kalite Personeli Memnuniyet Arama Görevleri (FIFO)
   * GET /api/admin/call-tasks
   */
  @Get('call-tasks')
  @HttpCode(HttpStatus.OK)
  async getCallTasksFifo(@CurrentUser() user: any) {
    return this.adminService.getCallTasksFifo(user.email);
  }

  /**
   * Kalite Personeli Arama Sonucu Kaydetme
   * POST /api/admin/call-tasks/:id/result
   */
  @Post('call-tasks/:id/result')
  @HttpCode(HttpStatus.OK)
  async submitCallTaskResult(
    @Param('id') id: string,
    @Body() dto: CallTaskResultDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.submitCallTaskResult(user.email, id, dto);
  }

  /**
   * NPS Analiz Paneli istatistikleri
   * GET /api/admin/nps/stats
   */
  @Get('nps/stats')
  @HttpCode(HttpStatus.OK)
  async getNpsStats(@CurrentUser() user: any) {
    return this.adminService.getNpsStats(user.email);
  }

  /**
   * NPS 3+ Detraktör Alarmları
   * GET /api/admin/nps/alarms
   */
  @Get('nps/alarms')
  @HttpCode(HttpStatus.OK)
  async getNpsAlarms(@CurrentUser() user: any) {
    return this.adminService.getNpsAlarms(user.email);
  }

  /**
   * Role Göre Özelleşen Personel Dashboard'u
   * GET /api/admin/dashboard/role/:role
   */
  @Get('dashboard/role/:role')
  @HttpCode(HttpStatus.OK)
  async getRoleDashboardStats(
    @Param('role') role: string,
    @CurrentUser() user: any
  ) {
    return this.adminService.getRoleDashboardStats(user.email, role);
  }

  /**
   * Redis A/B Test Ayarlarını Getir
   * GET /api/admin/ab-test/config
   */
  @Get('ab-test/config')
  @HttpCode(HttpStatus.OK)
  async getAbTestConfig(@CurrentUser() user: any) {
    return this.adminService.getAbTestConfig(user.email);
  }

  /**
   * Redis A/B Test Ayarlarını Güncelle
   * POST /api/admin/ab-test/config
   */
  @Post('ab-test/config')
  @HttpCode(HttpStatus.OK)
  async saveAbTestConfig(
    @Body() dto: SaveAbTestConfigDto,
    @CurrentUser() user: any
  ) {
    return this.adminService.saveAbTestConfig(user.email, dto);
  }

  /**
   * Sistem Denetim Günlükleri
   * GET /api/admin/audit-logs
   */
  @Get('audit-logs')
  @HttpCode(HttpStatus.OK)
  async getAuditLogs(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @CurrentUser() user: any
  ) {
    return this.adminService.getAuditLogs(user.email, parseInt(page), parseInt(limit));
  }

  /**
   * Kampanyalar listesi
   * GET /api/admin/campaigns
   */
  @Get('campaigns')
  @HttpCode(HttpStatus.OK)
  async getCampaigns(@CurrentUser() user: any) {
    return this.adminService.getCampaigns(user.email);
  }

  /**
   * Yeni Kampanya oluşturma
   * POST /api/admin/campaigns
   */
  @Post('campaigns')
  @HttpCode(HttpStatus.OK)
  async createCampaign(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() user: any
  ) {
    return this.adminService.createCampaign(user.email, dto);
  }

  /**
   * Bölgesel KPI ve Performans Analiz Raporu
   * GET /api/admin/reports/regional-kpi
   */
  @Get('reports/regional-kpi')
  @HttpCode(HttpStatus.OK)
  async getRegionalKpiReport(
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('period') period?: string,
    @CurrentUser() user?: any
  ) {
    return this.adminService.getRegionalKpiReport({ city, district, categorySlug, period }, user.email);
  }
}
