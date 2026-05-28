import { Controller, Post, Body, Req, Headers, HttpStatus, HttpCode } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/message.dto';
import { Public } from '../../common/decorators';

@Controller()
export class ChatController {
  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  @Public()
  @Post('ortak/chat/anonim/baslat')
  @HttpCode(HttpStatus.OK)
  async startAnonymousSession(@Headers('x-session-id') sessionUuid?: string) {
    console.log(`[ChatController] startAnonymousSession received x-session-id: ${sessionUuid}`);
    return this.chatService.startAnonymousSession(sessionUuid);
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
      } catch (err) {
        // Suppress validation error to support seamless anonymous fallback
        console.log('[Chat Controller] Invalid optional JWT, processing as guest');
      }
    }

    // 2. Delegate message parsing to the ChatService
    return this.chatService.handleMessage(userId, sessionId, dto.message);
  }
}
