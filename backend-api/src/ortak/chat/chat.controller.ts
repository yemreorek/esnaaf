import { Controller, Post, Body, Req, Headers, HttpStatus, HttpCode, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/message.dto';
import { Public } from '../../common/decorators';
import { randomUUID } from 'crypto';
import { IndustryExpertAgent } from '../agent/industry-expert.agent';

@Controller()
export class ChatController {
  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private industryExpertAgent: IndustryExpertAgent,
  ) {}

  @Public()
  @Post('admin/chat/backfill-questions')
  @HttpCode(HttpStatus.OK)
  async backfillQuestions() {
    this.industryExpertAgent.backfillExistingCategories(); // Async fire and forget
    return { success: true, message: 'Backfill process started in the background.' };
  }

  @Public()
  @Post('ortak/chat/anonim/baslat')
  @HttpCode(HttpStatus.OK)
  async startAnonymousSession(
    @Req() req: any,
    @Headers('x-session-id') sessionIdHeader?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const sessionUuid = sessionIdHeader || randomUUID();
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_min_32_characters',
        });
        userId = payload.sub;
        if (payload.isImpersonated) {
          throw new ForbiddenException('Ön izleme (taklit) modundayken bu işlemi gerçekleştiremezsiniz.');
        }
        console.log(`[ChatController] Resolved userId ${userId} for startAnonymousSession`);
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        console.log('[ChatController] Invalid optional JWT in startAnonymousSession, processing as guest');
      }
    }

    return this.chatService.startAnonymousSession(sessionUuid, userId);
  }

  @Public()
  @Post('musteri/chat/mesaj')
  @HttpCode(HttpStatus.OK)
  async handleMessage(
    @Req() req: any,
    @Body() dto: MessageDto,
    @Headers('x-session-id') sessionIdHeader?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    let userId: string | null = null;
    const sessionId = sessionIdHeader || 'default_session';
    console.log(`[ChatController] handleMessage received x-session-id: ${sessionIdHeader}, using sessionId: ${sessionId}`);

    // 1. Check if an authenticated user's JWT token is supplied
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_min_32_characters',
        });
        userId = payload.sub;
        if (payload.isImpersonated) {
          throw new ForbiddenException('Ön izleme (taklit) modundayken bu işlemi gerçekleştiremezsiniz.');
        }
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        // Suppress validation error to support seamless anonymous fallback
        console.log('[Chat Controller] Invalid optional JWT, processing as guest');
      }
    }

    // 2. Delegate message parsing to the ChatService
    const result: any = await this.chatService.handleMessage(userId, sessionId, dto.message);

    // 3. If session has migrated (OTP verified), issue JWT tokens
    if (result && result.sessionMigrated && result.user) {
      const payload = { sub: result.user.id, phone: result.user.phone, role: result.user.role };
      
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_min_32_characters',
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
      });

      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'some_super_secret_refresh_key_min_32_characters',
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
      });

      result.accessToken = accessToken;
      result.refreshToken = refreshToken;
    }

    return result;
  }
}
