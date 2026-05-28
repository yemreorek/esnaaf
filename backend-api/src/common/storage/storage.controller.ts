import { Controller, Get, Put, Query, Req, Res, HttpStatus, Logger } from '@nestjs/common';
import * as Express from 'express';
import { StorageService } from './storage.service';
import { Public } from '../decorators';

@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Get('presigned-url')
  async getPresignedUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ) {
    this.logger.log(`Requesting presigned URL for file: ${filename}, type: ${contentType}`);
    return this.storageService.getPresignedUrl(filename, contentType);
  }

  @Public()
  @Put('mock-upload')
  async mockUpload(
    @Query('file') filename: string,
    @Req() req: Express.Request,
    @Res() res: Express.Response,
  ) {
    this.logger.log(`Handling mock upload for file: ${filename}`);
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk) => chunks.push(chunk));
    
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const url = this.storageService.saveMockFile(filename, buffer);
        this.logger.log(`Mock upload successful. Public URL: ${url}`);
        return res.status(HttpStatus.OK).json({ success: true, url });
      } catch (err) {
        this.logger.error(`Mock upload failed for ${filename}:`, err);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Local upload failed',
        });
      }
    });

    req.on('error', (err) => {
      this.logger.error(`Request stream error during mock upload:`, err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Stream reading error',
      });
    });
  }

  @Public()
  @Get('uploads/:filename')
  async serveFile(@Req() req: Express.Request, @Res() res: Express.Response) {
    const filename = req.params.filename as string;
    try {
      const stream = this.storageService.getMockFileStream(filename);
      res.setHeader('Content-Type', 'image/jpeg'); // Default to image
      stream.pipe(res);
    } catch (err) {
      return res.status(HttpStatus.NOT_FOUND).json({ error: 'File not found' });
    }
  }
}
