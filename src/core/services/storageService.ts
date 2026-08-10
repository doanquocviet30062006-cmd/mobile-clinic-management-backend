import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../../config/logger';
import { AppError } from '../errors/AppError';

export class StorageService {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const region = process.env.AWS_REGION || 'ap-southeast-1';
    this.bucket = process.env.S3_BUCKET_NAME || 'clinic-medical-records';
    
    // In a real prod environment, AWS credentials might be automatically loaded from IAM roles.
    // For local dev, they are in .env
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock_access_key',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock_secret_key',
      },
    });
  }

  /**
   * Generate a presigned URL for the client to directly upload a file to S3.
   * Default TTL: 15 minutes (900 seconds)
   */
  async generateUploadUrl(key: string, contentType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      // URL expires in 15 minutes
      const url = await getSignedUrl(this.client, command, { expiresIn: 900 });
      return url;
    } catch (error) {
      logger.error({ error, key }, 'Failed to generate S3 upload presigned URL');
      throw new AppError('Failed to generate upload URL', 500, 'STORAGE_ERROR');
    }
  }

  /**
   * Generate a presigned URL for the client to download a file from S3.
   * Default TTL: 5 minutes (300 seconds)
   */
  async generateDownloadUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      // URL expires in 5 minutes
      const url = await getSignedUrl(this.client, command, { expiresIn: 300 });
      return url;
    } catch (error) {
      logger.error({ error, key }, 'Failed to generate S3 download presigned URL');
      throw new AppError('Failed to generate download URL', 500, 'STORAGE_ERROR');
    }
  }
}

export const storageService = new StorageService();
