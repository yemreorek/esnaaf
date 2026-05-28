import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';
import { RedisService } from './common/redis/redis.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkHealth(): Promise<{ database: string; redis: string; status: string }> {
    let databaseStatus = 'DOWN';
    let redisStatus = 'DOWN';

    // 1. Check PostgreSQL Prisma
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'UP';
    } catch (err) {
      this.logger.error('Health Check - Database is DOWN:', err);
    }

    // 2. Check Redis
    try {
      const pong = await this.redis.ping();
      if (pong === 'PONG') {
        redisStatus = 'UP';
      }
    } catch (err) {
      this.logger.error('Health Check - Redis is DOWN:', err);
    }

    const overallStatus = databaseStatus === 'UP' && redisStatus === 'UP' ? 'UP' : 'DOWN';

    return {
      status: overallStatus,
      database: databaseStatus,
      redis: redisStatus,
    };
  }
}
