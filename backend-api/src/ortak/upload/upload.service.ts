import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageService } from '../../common/storage/storage.service';

@Injectable()
export class UploadService {
  constructor(private readonly storageService: StorageService) {}

  async generatePresignedUrl(
    userId: string,
    fileName: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    // Enforce safe filename and prefixing
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `uploads/${userId}/${Date.now()}_${cleanFileName}`;

    try {
      const result = await this.storageService.getPresignedUrl(uniqueName, contentType);
      return {
        uploadUrl: result.uploadUrl,
        fileUrl: result.downloadUrl,
        key: uniqueName,
      };
    } catch (err) {
      throw new BadRequestException('Presigned URL oluşturulamadı: ' + err.message);
    }
  }
}
