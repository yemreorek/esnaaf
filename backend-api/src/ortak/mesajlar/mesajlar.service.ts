import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MesajlarService {
  private readonly logger = new Logger(MesajlarService.name);

  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
  ) {}

  /**
   * Yeni mesaj kaydeder ve WebSocket ile canlı olarak diğer tarafa iletir
   */
  async createMessage(senderUserId: string, dto: CreateMessageDto) {
    // 1. İlgili teklifi ve talebi sorgula
    const offer = await this.prisma.offer.findUnique({
      where: { id: dto.offerId },
      include: {
        job: {
          include: {
            category: true,
          },
        },
        provider: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Teklif bulunamadı.');
    }

    if (offer.job_id !== dto.jobId) {
      throw new BadRequestException('Bu teklif belirtilen talebe ait değil.');
    }

    // 2. Yetkilendirme Kontrolü (Gönderen seeker veya provider olmalıdır)
    const isSeeker = offer.job.seeker_id === senderUserId;
    const isProvider = offer.provider.user_id === senderUserId;

    if (!isSeeker && !isProvider) {
      throw new ForbiddenException('Bu sohbet odasına mesaj gönderme yetkiniz bulunmamaktadır.');
    }

    // 3. Alıcıyı belirle
    const receiverId = isSeeker ? offer.provider.user_id : offer.job.seeker_id;

    // 4. Mesajı veritabanına kaydet
    const message = await this.prisma.message.create({
      data: {
        job_id: dto.jobId,
        offer_id: dto.offerId,
        sender_id: senderUserId,
        receiver_id: receiverId,
        content: dto.content,
        content_type: dto.contentType || 'text',
      },
    });

    // 5. WebSocket (Socket.io) ile odaya canlı olarak yayınla
    const room = `job_${dto.jobId}`;
    this.chatGateway.server?.to(room).emit('new_message', {
      id: message.id,
      jobId: message.job_id,
      offerId: message.offer_id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      content: message.content,
      contentType: message.content_type,
      isRead: message.is_read,
      createdAt: message.created_at,
    });

    // 6. Alıcı bir usta ise usta genel odasına (provider_${provider.id}) bildirim gönder
    if (isSeeker) {
      const providerRoom = `provider_${offer.provider.id}`;
      const customerName = offer.job.form_data ? (offer.job.form_data as any).name || 'Müşteri' : 'Müşteri';
      this.chatGateway.server?.to(providerRoom).emit('new_message_notification', {
        id: message.id,
        content: message.content,
        createdAt: message.created_at,
        jobId: message.job_id,
        offerId: message.offer_id,
        categoryName: offer.job.category.name,
        customerName,
      });
      this.logger.log(`[Mesaj Bildirimi] Provider room ${providerRoom} içindeki ustaya yeni mesaj bildirimi iletildi.`);
    }

    this.logger.log(`[Mesaj Gönderildi] Room ${room} içindeki sohbet odasına yeni mesaj iletildi.`);

    return message;
  }

  /**
   * Bir iş ve teklif için tüm sohbet geçmişini getirir
   */
  async getMessages(userId: string, jobId: string, offerId: string) {
    // 1. Yetkilendirme kontrolü
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        job: true,
        provider: true,
      },
    });

    if (!offer) {
      throw new NotFoundException('Teklif bulunamadı.');
    }

    if (offer.job_id !== jobId) {
      throw new BadRequestException('Bu teklif belirtilen talebe ait değil.');
    }

    const isSeeker = offer.job.seeker_id === userId;
    const isProvider = offer.provider.user_id === userId;

    if (!isSeeker && !isProvider) {
      throw new ForbiddenException('Bu sohbet geçmişini görüntüleme yetkiniz bulunmamaktadır Sobhete taraf değilsiniz.');
    }

    // 2. Mesajları tarihe göre sıralı çek
    return this.prisma.message.findMany({
      where: {
        job_id: jobId,
        offer_id: offerId,
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  /**
   * Mesajı okundu olarak işaretler
   */
  async markAsRead(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Mesaj bulunamadı.');
    }

    // Yalnızca alıcı okundu olarak işaretleyebilir
    if (message.receiver_id !== userId) {
      throw new ForbiddenException('Bu mesajı okundu olarak işaretleme yetkiniz bulunmamaktadır.');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { is_read: true },
    });
  }
}
