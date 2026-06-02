import { Controller, Post, Get, Body, Headers, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterProviderDto } from './dto/register-provider.dto';
import { ProviderLoginDto } from './dto/provider-login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators';

@Controller('ortak/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Public()
  @Post('register-provider')
  @HttpCode(HttpStatus.OK)
  async registerProvider(@Body() dto: RegisterProviderDto) {
    return this.authService.registerProvider(dto);
  }

  @Public()
  @Post('provider-login')
  @HttpCode(HttpStatus.OK)
  async providerLogin(@Body() dto: ProviderLoginDto) {
    return this.authService.providerLogin(dto);
  }

  @Public()
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories() {
    return this.authService.getCategories();
  }

  @UseGuards(JwtAuthGuard)
  @Post('kvkk/accept')
  @HttpCode(HttpStatus.OK)
  async acceptKvkk(@Req() req: any) {
    return this.authService.acceptKvkk(req.user.id);
  }

  @Public()
  @Post('anonim/baslat')
  @HttpCode(HttpStatus.OK)
  async startAnonymousSession(@Headers('x-session-id') sessionUuid?: string) {
    return this.authService.startAnonymousSession(sessionUuid);
  }
}

