import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  /**
   * Bir müşterinin favori usta listesine usta ekler.
   * Koşullar:
   * 1. Usta ile müşteri arasında en az bir tamamlanmış iş (JobCompletion.status = 'completed') olmalıdır.
   * 2. Müşteri bu usta için puanlama/yorum (Review) yapmış olmalıdır.
   * 3. Müşterinin maksimum 20 favori usta sınırı aşılmamalıdır.
   */
  async addFavorite(seekerId: string, providerId: string) {
    // 1. Hizmet verenin varlığını kontrol et
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren bulunamadı.');
    }

    // 2. Halihazırda favoride mi kontrol et
    const existing = await this.prisma.favoriteProvider.findUnique({
      where: {
        seeker_id_provider_id: {
          seeker_id: seekerId,
          provider_id: providerId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Bu hizmet veren zaten favori listenizde bulunuyor.');
    }

    // 3. Maksimum limit kontrolü (20 favori)
    const currentFavoritesCount = await this.prisma.favoriteProvider.count({
      where: { seeker_id: seekerId },
    });

    if (currentFavoritesCount >= 20) {
      throw new BadRequestException('Maksimum favori usta sınırına (20) ulaştınız.');
    }

    // 4. Tamamlanmış iş kontrolü (seeker_id ve provider_id eşleşen en az bir tamamlanmış iş)
    const completedJob = await this.prisma.jobCompletion.findFirst({
      where: {
        seeker_id: seekerId,
        provider_id: providerId,
        status: 'completed',
      },
    });

    if (!completedJob) {
      throw new BadRequestException('Bu ustayı favorilerinize eklemek için önce onunla tamamlanmış bir işinizin olması gerekir.');
    }

    // 5. Yorum/Puanlama kontrolü
    const review = await this.prisma.review.findFirst({
      where: {
        reviewer_id: seekerId,
        provider_id: providerId,
      },
    });

    if (!review) {
      throw new BadRequestException('Bu ustayı favorilerinize eklemek için önce değerlendirme/puanlama yapmanız gerekmektedir.');
    }

    // 6. Kaydı oluştur
    return this.prisma.favoriteProvider.create({
      data: {
        seeker_id: seekerId,
        provider_id: providerId,
      },
      include: {
        provider: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Favori usta kaydını siler.
   */
  async removeFavorite(seekerId: string, providerId: string) {
    const favorite = await this.prisma.favoriteProvider.findUnique({
      where: {
        seeker_id_provider_id: {
          seeker_id: seekerId,
          provider_id: providerId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favori usta kaydı bulunamadı.');
    }

    return this.prisma.favoriteProvider.delete({
      where: {
        seeker_id_provider_id: {
          seeker_id: seekerId,
          provider_id: providerId,
        },
      },
    });
  }

  /**
   * Müşterinin tüm favori ustalarını listeler.
   */
  async getFavorites(seekerId: string) {
    return this.prisma.favoriteProvider.findMany({
      where: { seeker_id: seekerId },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone_masked: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
