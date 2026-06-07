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

  /**
   * Helper method to cache db queries or service calls.
   */
  async getOrSet<T>(key: string, fn: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = await this.get(key);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch (err) {
        console.warn(`Cache parse error for key ${key}:`, err);
      }
    }
    const freshData = await fn();
    try {
      if (ttlSeconds) {
        await this.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
      } else {
        await this.set(key, JSON.stringify(freshData));
      }
    } catch (err) {
      console.error(`Cache set error for key ${key}:`, err);
    }
    return freshData;
  }

  /**
   * Invalidate all keys matching a pattern.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length > 0) {
      await this.del(...keys);
    }
  }
}
