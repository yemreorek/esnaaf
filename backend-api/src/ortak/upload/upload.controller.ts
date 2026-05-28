import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { UploadService } from './upload.service';
import { PresignedUrlDto } from './dto/presigned-url.dto';

@Controller('ortak/upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-url')
  async getPresignedUrl(
    @CurrentUser() user: any,
    @Body() dto: PresignedUrlDto,
  ) {
    const userId = user.userId || user.id;
    const result = await this.uploadService.generatePresignedUrl(
      userId,
      dto.fileName,
      dto.contentType,
    );

    return {
      success: true,
      message: 'Presigned URL başarıyla üretildi.',
      ...result,
    };
  }
}
