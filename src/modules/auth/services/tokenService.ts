import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { redisSession } from '../../../config/redis';
import { logger } from '../../../config/logger';
import { UnauthorizedError } from '../../../core/errors/AppError';
import { UserRole } from '../../../types/database';

export interface TokenPayload {
  userId: string;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-production';
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export class TokenService {
  /**
   * Generates a short-lived JWT access token (stateless)
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  }

  /**
   * Verifies an access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired access token', 'TOKEN_EXPIRED');
    }
  }

  /**
   * Generates a long-lived opaque refresh token (stateful, stored in Redis)
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = uuidv4();
    const key = `refresh_token:${refreshToken}`;

    // Store in Redis (db1) with 30 days TTL
    await redisSession.setex(key, REFRESH_TOKEN_TTL, userId);

    return refreshToken;
  }

  /**
   * Validates and rotates a refresh token.
   * Defends against Replay Attacks: If the token is reused (not found in Redis but was issued before),
   * we must assume it was stolen, but since we delete upon use, a "not found" could just mean expired.
   * To properly detect reuse, we would need to keep a blacklist of used tokens.
   * For simplicity and high security: if the token is valid, we delete it and issue a new one (Rotation).
   */
  async rotateRefreshToken(oldRefreshToken: string): Promise<{ newRefreshToken: string; userId: string }> {
    const key = `refresh_token:${oldRefreshToken}`;
    const userId = await redisSession.get(key);

    if (!userId) {
      // Token not found (either expired, invalid, or already used/stolen).
      // In a strict environment, if we suspect theft, we could delete ALL tokens for the user.
      // For now, just reject.
      throw new UnauthorizedError('Invalid refresh token. Please login again.', 'INVALID_REFRESH_TOKEN');
    }

    // Delete the old token (Rotation)
    await redisSession.del(key);

    // Generate a new one
    const newRefreshToken = await this.generateRefreshToken(userId);

    return { newRefreshToken, userId };
  }

  /**
   * Revokes a specific refresh token (Logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await redisSession.del(`refresh_token:${refreshToken}`);
  }

  /**
   * Revokes ALL refresh tokens for a user (Kick out from all devices)
   * This is done by scanning/maintaining a set of tokens per user.
   * For this implementation, we will use a Redis scan to find and delete.
   * In a real high-scale prod, we should maintain a Set `user_tokens:{userId}` -> [...tokens].
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    // Simplified scan for demo (Warning: SCAN in prod should be used carefully)
    let cursor = '0';
    do {
      const result = await redisSession.scan(cursor, 'MATCH', 'refresh_token:*', 'COUNT', 100);
      cursor = result[0];
      const keys = result[1];

      for (const key of keys) {
        const id = await redisSession.get(key);
        if (id === userId) {
          await redisSession.del(key);
        }
      }
    } while (cursor !== '0');
    
    logger.warn({ userId }, 'All sessions revoked for user');
  }
}

export const tokenService = new TokenService();
