import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './ortak/auth/auth.module';
import { ChatModule } from './ortak/chat/chat.module';
import { JobCompletionModule } from './ortak/job-completion/job-completion.module';
import { TaleplerModule } from './musteri/talepler/talepler.module';
import { HizmetverenModule } from './hizmetveren/hizmetveren.module';
import { MesajlarModule } from './ortak/mesajlar/mesajlar.module';
import { AdminModule } from './admin/admin.module';
import { TamamlamaHizmetverenModule } from './hizmetveren/tamamlama/tamamlama-hizmetveren.module';
import { TamamlamaMusteriModule } from './musteri/tamamlama/tamamlama-musteri.module';
import { AbonelikModule } from './hizmetveren/abonelik/abonelik.module';
import { BildirimModule } from './ortak/bildirimler/bildirim.module';
import { StorageModule } from './common/storage/storage.module';
import { ReviewModule } from './ortak/reviews/review.module';
import { ReferralModule } from './ortak/referral/referral.module';
import { FavoriteModule } from './ortak/favorites/favorite.module';
import { UploadModule } from './ortak/upload/upload.module';
import { SeoModule } from './ortak/seo/seo.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Global Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL) || 60000,
        limit: Number(process.env.THROTTLE_LIMIT) || 100,
      },
    ]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // BullMQ Queue System (Redis connection)
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),

    // Global Database Module
    PrismaModule,

    // Global Redis Module
    RedisModule,

    // Storage Module
    StorageModule,

    // Review Module
    ReviewModule,

    // Auth Module
    AuthModule,

    // Chat Module
    ChatModule,

    // Job Completion Module
    JobCompletionModule,

    // Seeker Talepler Module
    TaleplerModule,

    // Hizmetveren Panel Module
    HizmetverenModule,

    // Ortak Mesajlaşma Module
    MesajlarModule,

    // Admin Panel Module
    AdminModule,

    // Hizmetveren Tamamlama Module
    TamamlamaHizmetverenModule,

    // Seeker Tamamlama Module
    TamamlamaMusteriModule,

    // Abonelik & Ödeme Module
    AbonelikModule,

    // NPS & Bildirimler Module
    BildirimModule,

    // Referral Module
    ReferralModule,

    // Favorite Module
    FavoriteModule,
    // Upload Module
    UploadModule,

    // Programmatic SEO Module
    SeoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
