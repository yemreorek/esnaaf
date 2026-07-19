import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators';
import { CITIES_DISTRICTS } from './common/constants/locations.constant';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  async getHealth() {
    const health = await this.appService.checkHealth();
    if (health.status === 'DOWN') {
      throw new ServiceUnavailableException({
        success: false,
        message: 'Sistem bileşenlerinden bazıları çevrimdışı.',
        ...health,
      });
    }

    return {
      success: true,
      message: 'Sistem sağlıklı bir şekilde çalışıyor.',
      ...health,
    };
  }

  @Public()
  @Get('api/ortak/konumlar')
  getLocations() {
    return {
      success: true,
      data: CITIES_DISTRICTS
    };
  }
}
