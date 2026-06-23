import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.populateEsnaafIds();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  generateRandomEsnaafCode(): string {
    const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return `ESN-${code}`;
  }

  async populateEsnaafIds() {
    try {
      const usersWithoutId = await this.user.findMany({
        where: { esnaaf_id: null }
      });
      if (usersWithoutId.length > 0) {
        console.log(`[Esnaaf ID Populate] Found ${usersWithoutId.length} users without Esnaaf ID. Generating...`);
        for (const user of usersWithoutId) {
          let uniqueId = '';
          let isUnique = false;
          let attempts = 0;
          while (!isUnique && attempts < 100) {
            attempts++;
            uniqueId = this.generateRandomEsnaafCode();
            const existing = await this.user.findUnique({
              where: { esnaaf_id: uniqueId }
            });
            if (!existing) isUnique = true;
          }
          if (isUnique) {
            await this.user.update({
              where: { id: user.id },
              data: { esnaaf_id: uniqueId }
            });
          }
        }
        console.log(`[Esnaaf ID Populate] Successfully generated Esnaaf IDs.`);
      }
    } catch (err: any) {
      console.error(`[Esnaaf ID Populate] Error: ${err.message}`);
    }
  }

  async ensureEsnaafId(userId: string): Promise<string> {
    const user = await this.user.findUnique({
      where: { id: userId },
      select: { esnaaf_id: true }
    });
    if (!user) return '';
    if (user.esnaaf_id) return user.esnaaf_id;

    let uniqueId = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      attempts++;
      uniqueId = this.generateRandomEsnaafCode();
      const existing = await this.user.findUnique({
        where: { esnaaf_id: uniqueId }
      });
      if (!existing) isUnique = true;
    }
    if (isUnique) {
      await this.user.update({
        where: { id: userId },
        data: { esnaaf_id: uniqueId }
      });
      return uniqueId;
    }
    return '';
  }
}
