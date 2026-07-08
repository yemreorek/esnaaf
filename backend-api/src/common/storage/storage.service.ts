import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storageClient: any;
  private isGcsConfigured = false;
  private bucketName: string | undefined;

  constructor() {
    this.bucketName = process.env.GCS_BUCKET_NAME || 'esnaaf-uploads';
    
    try {
      // Lazy load to prevent crash if not installed
      const { Storage } = require('@google-cloud/storage');
      // In GCP Cloud Run, default credentials are automatically used.
      this.storageClient = new Storage();
      this.isGcsConfigured = true;
      this.logger.log('Google Cloud Storage client initialized successfully.');
    } catch (err) {
      this.logger.warn(
        'GCS SDK is not installed or failed to init. Falling back to local Mock Storage.',
      );
    }
  }

  async getPresignedUrl(
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; downloadUrl: string; isMock: boolean }> {
    const uniqueFilename = `${Date.now()}-${filename}`;

    if (this.isGcsConfigured && this.bucketName) {
      try {
        const bucket = this.storageClient.bucket(this.bucketName);
        const file = bucket.file(uniqueFilename);
        
        // Expiration in milliseconds
        const expires = Date.now() + (Number(process.env.GCS_PRESIGNED_URL_EXPIRES) || 900) * 1000;

        const options = {
          version: 'v4' as const,
          action: 'write' as const,
          expires: expires,
          contentType: contentType,
        };

        const [uploadUrl] = await file.getSignedUrl(options);
        const downloadUrl = `https://storage.googleapis.com/${this.bucketName}/${uniqueFilename}`;

        return { uploadUrl, downloadUrl, isMock: false };
      } catch (err) {
        this.logger.error('Failed to generate GCS presigned URL, falling back to mock:', err);
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
