import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators';

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
}
