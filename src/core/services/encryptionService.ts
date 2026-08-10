import crypto from 'crypto';
import { logger } from '../../config/logger';
import { AppError } from '../errors/AppError';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export class EncryptionService {
  private key: Buffer;

  constructor() {
    const hexKey = process.env.ENCRYPTION_KEY;
    if (!hexKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    this.key = Buffer.from(hexKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM
   * Returns format: iv:authTag:encryptedData (hex encoded)
   */
  encrypt(text: string): string {
    if (!text) return text;
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag().toString('hex');
      
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
      logger.error({ error }, 'Encryption failed');
      throw new AppError('Failed to encrypt data', 500, 'ENCRYPTION_ERROR');
    }
  }

  /**
   * Decrypts ciphertext previously encrypted by this service
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) return ciphertext;
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error({ error }, 'Decryption failed');
      throw new AppError('Failed to decrypt data', 500, 'DECRYPTION_ERROR');
    }
  }
}

export const encryptionService = new EncryptionService();
