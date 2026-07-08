import { Controller, Post, Get, Body, Headers, UseGuards, Req, Res, HttpStatus, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
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

  private setCookies(res: Response, tokens: { accessToken: string, refreshToken: string }) {
    const isSecure = process.env.NODE_ENV !== 'development';
    res.cookie('esnaaf_token', tokens.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });
    res.cookie('esnaaf_refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/api/ortak/auth/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyOtp(dto);
    this.setCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, refreshToken, ...rest } = result;
    return rest;
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: any, @Res({ passthrough: true }) res: Response, @Body() dto: RefreshTokenDto) {
    // Read from cookie first, fallback to body
    const token = req.cookies?.esnaaf_refresh_token || dto.refreshToken;
    const result = await this.authService.refreshTokens({ refreshToken: token });
    this.setCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, refreshToken, ...rest } = result;
    return rest;
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
  async providerLogin(@Body() dto: ProviderLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.providerLogin(dto);
    this.setCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, refreshToken, ...rest } = result;
    return rest;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    const isSecure = process.env.NODE_ENV !== 'development';
    res.clearCookie('esnaaf_token', { httpOnly: true, secure: isSecure, sameSite: 'lax' });
    res.clearCookie('esnaaf_refresh_token', { httpOnly: true, secure: isSecure, sameSite: 'lax', path: '/api/ortak/auth/refresh-token' });
    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: any) {
    return { user: req.user };
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
