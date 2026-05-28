import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  onModuleInit() {
    console.log('Redis connected successfully.');
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
