import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: any;
  private isS3Configured = false;

  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.AWS_S3_BUCKET;

    if (accessKeyId && secretAccessKey && bucket) {
      try {
        const { S3Client } = require('@aws-sdk/client-s3');
        this.s3Client = new S3Client({
          region: process.env.AWS_REGION || 'eu-central-1',
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.isS3Configured = true;
        this.logger.log('S3 Storage client initialized successfully.');
      } catch (err) {
        this.logger.warn(
          'AWS SDK is not installed. Falling back to local Mock Storage.',
        );
      }
    } else {
      this.logger.log(
        'AWS S3 credentials not fully configured. Using local Mock Storage.',
      );
    }
  }

  async getPresignedUrl(
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; downloadUrl: string; isMock: boolean }> {
    const uniqueFilename = `${Date.now()}-${filename}`;

    if (this.isS3Configured) {
      try {
        const { PutObjectCommand } = require('@aws-sdk/client-s3');
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

        const bucket = process.env.AWS_S3_BUCKET;
        const region = process.env.AWS_REGION || 'eu-central-1';
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: uniqueFilename,
          ContentType: contentType,
        });

        const expires = Number(process.env.S3_PRESIGNED_URL_EXPIRES) || 900;
        const uploadUrl = await getSignedUrl(this.s3Client, command, {
          expiresIn: expires,
        });
        const downloadUrl = `https://${bucket}.s3.${region}.amazonaws.com/${uniqueFilename}`;

        return { uploadUrl, downloadUrl, isMock: false };
      } catch (err) {
        this.logger.error('Failed to generate S3 presigned URL, falling back to mock:', err);
      }
    }

    // Mock Presigned URL fallback
    const backendUrl = process.env.API_URL || 'http://localhost:3000/api';
    const uploadUrl = `${backendUrl}/storage/mock-upload?file=${uniqueFilename}`;
    const downloadUrl = `${backendUrl}/storage/uploads/${uniqueFilename}`;

    return { uploadUrl, downloadUrl, isMock: true };
  }

  // Helper method for local mock storage to save the file
  saveMockFile(filename: string, fileBuffer: Buffer): string {
    const uploadDir = path.join(os.tmpdir(), 'esnaaf-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    this.logger.log(`Mock file saved locally at: ${filePath}`);

    const backendUrl = process.env.API_URL || 'http://localhost:3000/api';
    return `${backendUrl}/storage/uploads/${filename}`;
  }

  // Read local mock file
  getMockFileStream(filename: string): fs.ReadStream {
    const uploadDir = path.join(os.tmpdir(), 'esnaaf-uploads');
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    return fs.createReadStream(filePath);
  }
}
