import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

export interface MarketPriceBounds {
  minPrice: number;
  maxPrice: number;
  formattedRange: string;
  source: 'auto_aggregated' | 'benchmark';
  updatedAt: string;
}

@Injectable()
export class MarketPriceAggregatorService implements OnModuleInit {
  private readonly logger = new Logger(MarketPriceAggregatorService.name);
  private readonly CACHE_KEY_PREFIX = 'esnaaf:market_price:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    this.logger.log('🚀 MarketPriceAggregatorService initialized. Running initial market price aggregation sync...');
    this.aggregateMarketPrices().catch((err) => {
      this.logger.warn(`Initial market price aggregation failed: ${err.message}`);
    });
  }

  /**
   * Weekly Cron Job: Runs every Sunday at 03:00 AM
   * Aggregates winning accepted offer prices from the database for the last 30 days
   */
  @Cron('0 3 * * 0')
  async aggregateMarketPrices(): Promise<Record<string, MarketPriceBounds>> {
    this.logger.log('📊 Starting weekly Market Price Auto-Aggregation task...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const aggregatedResults: Record<string, MarketPriceBounds> = {};

    try {
      const acceptedOffers = await this.prisma.offer.findMany({
        where: {
          status: 'accepted',
          created_at: { gte: thirtyDaysAgo },
        },
        include: {
          job: {
            select: {
              category: {
                select: { name: true }
              }
            }
          }
        },
      });

      const categoryPricesMap: Record<string, number[]> = {};
      for (const offer of acceptedOffers) {
        const categoryName = (offer as any).job?.category?.name || 'genel-hizmet';
        const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
        if (!categoryPricesMap[slug]) categoryPricesMap[slug] = [];
        categoryPricesMap[slug].push(Number(offer.price));
      }

      for (const [slug, prices] of Object.entries(categoryPricesMap)) {
        if (prices.length >= 3) {
          prices.sort((a, b) => a - b);
          const minIdx = Math.floor(prices.length * 0.1);
          const maxIdx = Math.ceil(prices.length * 0.9) - 1;
          const minPrice = Math.round(prices[minIdx] / 50) * 50;
          const maxPrice = Math.round(prices[Math.max(maxIdx, minIdx + 1)] / 50) * 50;

          const bounds: MarketPriceBounds = {
            minPrice,
            maxPrice,
            formattedRange: `₺${minPrice.toLocaleString('tr-TR')} - ₺${maxPrice.toLocaleString('tr-TR')}`,
            source: 'auto_aggregated',
            updatedAt: new Date().toISOString(),
          };

          aggregatedResults[slug] = bounds;
          await this.redis.set(`${this.CACHE_KEY_PREFIX}${slug}`, JSON.stringify(bounds), 'EX', 604800);
        }
      }

      this.logger.log(`✅ Market Price Auto-Aggregation complete. ${Object.keys(aggregatedResults).length} categories updated from live platform transactions.`);
    } catch (err: any) {
      this.logger.error(`❌ Market Price Auto-Aggregation error: ${err.message}`, err.stack);
    }

    return aggregatedResults;
  }

  /**
   * Get dynamic price range for a category (checks Redis auto-aggregated cache first, then benchmark matrix fallback)
   */
  async getPriceRange(slug?: string | null, data: Record<string, any> = {}): Promise<MarketPriceBounds> {
    const rawSlug = (slug || 'ev-temizligi').toLowerCase();
    
    try {
      const cached = await this.redis.get(`${this.CACHE_KEY_PREFIX}${rawSlug}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      // Redis fallback
    }

    return this.calculateBenchmarkPriceRange(rawSlug, data);
  }

  /**
   * Domain-accurate 2026 market matrix (Armut & Google AI benchmark data)
   */
  public calculateBenchmarkPriceRange(slug?: string | null, data: Record<string, any> = {}): MarketPriceBounds {
    const categoryName = (data.categoryName || '').toLowerCase();
    const rawSlug = (slug || '').toLowerCase();
    const combined = `${rawSlug} ${categoryName} ${JSON.stringify(data).toLowerCase()}`;

    let minPrice = 1000;
    let maxPrice = 2500;

    if (combined.includes('bilgisayar') || combined.includes('kasa') || combined.includes('laptop')) {
      if (combined.includes('gaming') || combined.includes('server') || combined.includes('sivi_temasi') || combined.includes('komple')) {
        minPrice = 1550; maxPrice = 3750;
      } else if (combined.includes('desktop') || combined.includes('toz_fan')) {
        minPrice = 750; maxPrice = 2250;
      } else {
        minPrice = 750; maxPrice = 3750;
      }
    } else if (combined.includes('utu') || combined.includes('ütü')) {
      minPrice = 500; maxPrice = 1400;
    } else if (combined.includes('kuru temizleme') || combined.includes('kuru-temizleme')) {
      minPrice = 400; maxPrice = 1200;
    } else if (combined.includes('sarma') || combined.includes('manti') || combined.includes('mantı')) {
      minPrice = 500; maxPrice = 1400;
    } else if (combined.includes('hali') || combined.includes('halı')) {
      minPrice = 500; maxPrice = 1600;
    } else if (combined.includes('yatak')) {
      minPrice = 750; maxPrice = 2200;
    } else if (combined.includes('cam silme') || combined.includes('cam temizliği') || combined.includes('cam temizligi')) {
      minPrice = 800; maxPrice = 2200;
    } else if (combined.includes('bocek') || combined.includes('böcek') || combined.includes('ilaclama') || combined.includes('ilaçlama')) {
      minPrice = 900; maxPrice = 2500;
    } else if (combined.includes('koltuk') && !combined.includes('arac') && !combined.includes('araç')) {
      minPrice = 950; maxPrice = 2800;
    } else if (combined.includes('yemek')) {
      minPrice = 1000; maxPrice = 2800;
    } else if (combined.includes('petek')) {
      minPrice = 950; maxPrice = 2600;
    } else if (combined.includes('buharli') || combined.includes('buharlı')) {
      minPrice = 1200; maxPrice = 3000;
    } else if (combined.includes('arac') || combined.includes('araç') || combined.includes('araba')) {
      minPrice = 1200; maxPrice = 3200;
    } else if (combined.includes('apartman') || combined.includes('merdiven')) {
      minPrice = 1200; maxPrice = 3200;
    } else if (combined.includes('ev-temizligi') || combined.includes('ev temizliği')) {
      if (combined.includes('3+1') || combined.includes('3_1') || combined.includes('4+1')) {
        minPrice = 2200; maxPrice = 3800;
      } else {
        minPrice = 1500; maxPrice = 2800;
      }
    } else if (combined.includes('ofis') || combined.includes('dukkan') || combined.includes('dükkan')) {
      minPrice = 1600; maxPrice = 4500;
    } else if (combined.includes('bos-ev') || combined.includes('boş ev')) {
      minPrice = 2200; maxPrice = 5500;
    } else if (combined.includes('su-deposu') || combined.includes('su deposu')) {
      minPrice = 2500; maxPrice = 6500;
    } else if (combined.includes('insaat') || combined.includes('inşaat') || combined.includes('tadilat-sonrasi')) {
      minPrice = 2800; maxPrice = 6800;
    } else if (combined.includes('mermer') || combined.includes('cila')) {
      minPrice = 3000; maxPrice = 8500;
    } else if (combined.includes('dis-cephe') || combined.includes('dış cephe')) {
      minPrice = 3500; maxPrice = 9500;
    } else if (combined.includes('boya') || combined.includes('badana')) {
      minPrice = 4500; maxPrice = 12500;
    } else if (combined.includes('parke')) {
      minPrice = 3500; maxPrice = 8500;
    } else if (combined.includes('fayans') || combined.includes('seramik')) {
      minPrice = 4500; maxPrice = 11500;
    } else if (combined.includes('nakliyat') || combined.includes('nakliye')) {
      minPrice = 6000; maxPrice = 16500;
    } else if (combined.includes('tadilat')) {
      minPrice = 15000; maxPrice = 45000;
    } else if (combined.includes('su-tesisat') || combined.includes('tesisat')) {
      minPrice = 750; maxPrice = 2200;
    } else if (combined.includes('kombi')) {
      minPrice = 750; maxPrice = 2000;
    } else if (combined.includes('klima')) {
      minPrice = 950; maxPrice = 2800;
    }

    const formatCurrency = (val: number) => `₺${val.toLocaleString('tr-TR')}`;
    return {
      minPrice,
      maxPrice,
      formattedRange: `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`,
      source: 'benchmark',
      updatedAt: new Date().toISOString(),
    };
  }
}
