import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators';
import { SeoService } from './seo.service';

@Controller('ortak/seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Public()
  @Get('page-metadata')
  async getPageMetadata(@Query('slug') slug: string) {
    return this.seoService.getPageMetadata(slug);
  }

  @Public()
  @Get('sitemap')
  async getSitemap() {
    const links = await this.seoService.getSitemapLinks();
    return { links };
  }
}
