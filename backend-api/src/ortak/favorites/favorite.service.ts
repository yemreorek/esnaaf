import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class FavoriteService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
  ) {}

  /**
   * Bir müşterinin favori usta listesine usta ekler.
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
      where: { seeker_id: seekerId, approved: true },
    });

    if (currentFavoritesCount >= 20) {
      throw new BadRequestException('Maksimum favori usta sınırına (20) ulaştınız.');
    }

    // 4. Tamamlanmış iş kontrolü (seeker_id ve provider_id eşleşen en az bir tamamlanmış iş)
    // Devre dışı bırakıldı: Müşteri dilediği hizmet vereni favorilerine ekleyebilir.
    /*
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
    */

    // 6. Kaydı oluştur (Seeker eklediği için approved = true)
    return this.prisma.favoriteProvider.create({
      data: {
        seeker_id: seekerId,
        provider_id: providerId,
        approved: true,
        created_by: 'seeker',
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
   * Müşterinin tüm favori ustalarını listeler (sadece approved olanlar).
   */
  async getFavorites(seekerId: string) {
    return this.prisma.favoriteProvider.findMany({
      where: { seeker_id: seekerId, approved: true },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone_masked: true,
                email: true,
                esnaaf_id: true,
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

  /**
   * Kendi Esnaaf ID'sini getirir.
   */
  async getProfileEsnaafId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { esnaaf_id: true }
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    return user.esnaaf_id || '';
  }

  /**
   * Esnaaf ID ile kullanıcı arama
   */
  async searchByEsnaafId(userId: string, userRole: string, esnaafId: string) {
    const cleanEsnaafId = esnaafId.toUpperCase().trim();
    
    // Eğer istek atan seeker ise, aranan kişi provider olmalı
    const expectedRole = userRole === 'service_seeker' ? 'service_provider' : 'service_seeker';
    
    const targetUser = await this.prisma.user.findFirst({
      where: { esnaaf_id: cleanEsnaafId, role: expectedRole },
      include: {
        service_provider: true,
      }
    });

    if (!targetUser) {
      throw new NotFoundException('Eşleşen aktif kullanıcı bulunamadı.');
    }

    return {
      id: targetUser.id,
      name: targetUser.name || 'Esnaaf Kullanıcı',
      esnaaf_id: targetUser.esnaaf_id,
      role: targetUser.role,
      providerId: targetUser.service_provider?.id || null,
    };
  }

  /**
   * Esnaaf ID ile favori/sadık müşteri bağlantı isteği oluşturma
   */
  async addEsnaafFavorite(userId: string, userRole: string, targetEsnaafId: string) {
    const cleanEsnaafId = targetEsnaafId.toUpperCase().trim();
    
    // Hedef kullanıcıyı bul
    const expectedRole = userRole === 'service_seeker' ? 'service_provider' : 'service_seeker';
    const targetUser = await this.prisma.user.findFirst({
      where: { esnaaf_id: cleanEsnaafId, role: expectedRole },
      include: {
        service_provider: true,
      }
    });

    if (!targetUser) {
      throw new NotFoundException('Hedef kullanıcı bulunamadı.');
    }

    if (userRole === 'service_seeker') {
      // Seeker, Provider'ı favoriye ekliyor (doğrudan onaylı)
      const providerId = targetUser.service_provider?.id;
      if (!providerId) throw new BadRequestException('Hedef kullanıcı hizmet veren değil.');

      const existing = await this.prisma.favoriteProvider.findUnique({
        where: {
          seeker_id_provider_id: {
            seeker_id: userId,
            provider_id: providerId,
          }
        }
      });

      if (existing) {
        if (existing.approved) {
          throw new BadRequestException('Bu usta zaten favorilerinizde bulunuyor.');
        } else {
          // Eğer önceden ustanın attığı pending istek varsa, onu onayla!
          const updated = await this.prisma.favoriteProvider.update({
            where: { id: existing.id },
            data: { approved: true }
          });
          return { success: true, message: 'Usta favori listenize eklendi.', data: updated };
        }
      }

      const created = await this.prisma.favoriteProvider.create({
        data: {
          seeker_id: userId,
          provider_id: providerId,
          approved: true,
          created_by: 'seeker',
        }
      });

      return { success: true, message: 'Usta favori listenize eklendi.', data: created };

    } else {
      // Provider, Seeker'ı sadık müşteri olarak eklemek istiyor (çift taraflı onay gerektirir)
      const provider = await this.prisma.serviceProvider.findUnique({
        where: { user_id: userId },
        include: { user: true }
      });
      if (!provider) throw new BadRequestException('Hizmet veren profiliniz bulunamadı.');

      const existing = await this.prisma.favoriteProvider.findUnique({
        where: {
          seeker_id_provider_id: {
            seeker_id: targetUser.id,
            provider_id: provider.id,
          }
        }
      });

      if (existing) {
        if (existing.approved) {
          throw new BadRequestException('Bu müşteri zaten sadık müşterileriniz arasında.');
        } else {
          throw new BadRequestException('Bu müşteri için zaten gönderilmiş bir onay bekleyen istek bulunuyor.');
        }
      }

      const created = await this.prisma.favoriteProvider.create({
        data: {
          seeker_id: targetUser.id,
          provider_id: provider.id,
          approved: false,
          created_by: 'provider',
        }
      });

      // WebSocket ile müşteriye anlık istek bildir
      try {
        this.chatGateway.server?.to(`user_${targetUser.id}`).emit('new_loyalty_request', {
          id: created.id,
          providerId: provider.id,
          providerName: provider.user?.name || 'Esnaf Usta',
          createdAt: created.created_at,
        });
      } catch (wsErr) {
        console.error('Failed to emit loyalty request WebSocket event:', wsErr);
      }

      return { success: true, message: 'Sadık müşteri ekleme talebi iletildi. Müşteri onayı bekleniyor.', data: created };
    }
  }

  /**
   * Müşterinin onay bekleyen sadık müşteri isteklerini listeler.
   */
  async getPendingRequests(seekerUserId: string) {
    return this.prisma.favoriteProvider.findMany({
      where: {
        seeker_id: seekerUserId,
        approved: false,
        created_by: 'provider',
      },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                esnaaf_id: true,
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Sadık müşteri isteğini onaylar.
   */
  async approveRequest(seekerUserId: string, favoriteId: string) {
    const favorite = await this.prisma.favoriteProvider.findUnique({
      where: { id: favoriteId }
    });

    if (!favorite) throw new NotFoundException('İstek bulunamadı.');
    if (favorite.seeker_id !== seekerUserId) throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');

    const updated = await this.prisma.favoriteProvider.update({
      where: { id: favoriteId },
      data: { approved: true }
    });

    return { success: true, message: 'Sadık müşteri bağlantısı başarıyla kuruldu.', data: updated };
  }

  /**
   * Sadık müşteri isteğini reddeder / siler.
   */
  async rejectRequest(seekerUserId: string, favoriteId: string) {
    const favorite = await this.prisma.favoriteProvider.findUnique({
      where: { id: favoriteId }
    });

    if (!favorite) throw new NotFoundException('İstek bulunamadı.');
    if (favorite.seeker_id !== seekerUserId) throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');

    await this.prisma.favoriteProvider.delete({
      where: { id: favoriteId }
    });

    return { success: true, message: 'İstek reddedildi ve silindi.' };
  }

  /**
   * Hizmet verenin tüm onaylanmış sadık müşterilerini listeler.
   */
  async getMyCustomers(providerUserId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { user_id: providerUserId }
    });
    if (!provider) throw new BadRequestException('Hizmet veren profili bulunamadı.');

    return this.prisma.favoriteProvider.findMany({
      where: {
        provider_id: provider.id,
        approved: true,
      },
      include: {
        seeker: {
          select: {
            id: true,
            name: true,
            phone_masked: true,
            email: true,
            esnaaf_id: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }
}
