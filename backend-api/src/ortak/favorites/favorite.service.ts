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
    const favorites = await this.prisma.favoriteProvider.findMany({
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

    // Resolve categories for each provider
    const allCategoryIds = Array.from(
      new Set(
        favorites.flatMap((fav) => fav.provider?.category_ids || [])
      )
    );

    const categories = await this.prisma.category.findMany({
      where: {
        id: { in: allCategoryIds },
      },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const helperGetCategorySlug = (name: string): string => {
      switch (name) {
        case 'Ev Temizliği': return 'ev-temizligi';
        case 'Boş Ev Temizliği': return 'bos-ev-temizligi';
        case 'Boya Badana': return 'boya-badana';
        case 'Su Tesisatı': return 'su-tesisati';
        case 'Elektrik Tesisatı': return 'elektrik-tesisati';
        case 'Ev Tadilat': return 'ev-tadilat';
        case 'Nakliyat / Ev Taşıma': return 'nakliyat';
        case 'Halı Yıkama': return 'hali-yikama';
        case 'Koltuk Yıkama': return 'koltuk-yikama';
        case 'İnşaat / Tadilat Sonrası Temizlik': return 'insaat-sonrasi-temizlik';
        case 'Fayans Döşeme': return 'fayans-doseme';
        case 'Parke Döşeme': return 'parke-doseme';
        case 'Haşere İlaçlama': return 'hasere-ilaclama';
        case 'Böcek İlaçlama': return 'bocek-ilaclama';
        case 'Kombi Servisi': return 'kombi-servisi';
        case 'Klima Servisi': return 'klima-servisi';
        case 'Mantolama': return 'mantolama';
        case 'Dış Cephe': return 'dis-cephe';
        case 'Marangoz': return 'marangoz';
        case 'Mobilya Montajı': return 'mobilya-montaji';
        case 'Özel Ders': return 'ozel-ders';
        case 'Cam Balkon': return 'cam-balkon';
        case 'PVC Pencere': return 'pvc-pencere';
        case 'Ofis Temizliği': return 'ofis-temizligi';
        case 'İş Yeri Temizliği': return 'is-yeri-temizligi';
        case 'Doğalgaz Tesisatı': return 'dogalgaz-tesisati';
        case 'İç Mimar': return 'ic-mimar';
        case 'Dekorasyon': return 'dekorasyon';
        case 'Fotoğrafçı': return 'fotografci';
        case 'Organizasyon': return 'organizasyon';
        case 'Etkinlik': return 'etkinlik';
        default: return 'genel-hizmet';
      }
    };

    return favorites.map((fav) => {
      if (!fav.provider) return fav;
      const provCategories = (fav.provider.category_ids || [])
        .map((id) => categoryMap.get(id))
        .filter(Boolean)
        .map((c) => ({
          id: c!.id,
          name: c!.name,
          slug: helperGetCategorySlug(c!.name),
        }));

      let onboardingData: any = {};
      if (fav.provider.description && fav.provider.description.startsWith('{')) {
        try {
          onboardingData = JSON.parse(fav.provider.description);
        } catch (e) {}
      }

      const cName = onboardingData.companyName || '';
      return {
        ...fav,
        provider: {
          ...fav.provider,
          categories: provCategories,
          companyName: cName,
          profilePhoto: onboardingData.profilePhoto || '',
          user: fav.provider.user ? {
            ...fav.provider.user,
            name: cName || fav.provider.user.name || 'Hizmet Veren'
          } : undefined
        },
      };
    });
  }

  /**
   * Kendi Esnaaf ID'sini getirir (yoksa otomatik oluşturur).
   */
  async getProfileEsnaafId(userId: string): Promise<string> {
    return this.prisma.ensureEsnaafId(userId);
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

    let profilePhoto = '';
    if (targetUser.service_provider?.description) {
      if (targetUser.service_provider.description.startsWith('{')) {
        try {
          const onboardingData = JSON.parse(targetUser.service_provider.description);
          profilePhoto = onboardingData.profilePhoto || '';
        } catch (e) {}
      }
    }

    return {
      id: targetUser.id,
      name: targetUser.name || 'Esnaaf Kullanıcı',
      esnaaf_id: targetUser.esnaaf_id,
      role: targetUser.role,
      providerId: targetUser.service_provider?.id || null,
      profilePhoto,
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
          providerName: provider.user?.name || 'Hizmet Veren',
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
    const list = await this.prisma.favoriteProvider.findMany({
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

    return list.map((item) => {
      if (!item.provider) return item;
      let onboardingData: any = {};
      if (item.provider.description && item.provider.description.startsWith('{')) {
        try {
          onboardingData = JSON.parse(item.provider.description);
        } catch (e) {}
      }

      const cName = onboardingData.companyName || '';
      return {
        ...item,
        provider: {
          ...item.provider,
          companyName: cName,
          profilePhoto: onboardingData.profilePhoto || '',
          user: item.provider.user ? {
            ...item.provider.user,
            name: cName || item.provider.user.name || 'Hizmet Veren'
          } : undefined
        }
      };
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
