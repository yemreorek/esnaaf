import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BildirimModule } from '../ortak/bildirimler/bildirim.module';
import { GraphSeederService } from './graph-seeder.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_min_32_characters',
    }),
    BildirimModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, GraphSeederService],
  exports: [AdminService],
})
export class AdminModule {}
