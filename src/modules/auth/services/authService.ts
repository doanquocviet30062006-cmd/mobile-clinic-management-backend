import argon2 from 'argon2';
import { userRepository } from '../repositories/userRepository';
import { tokenService } from './tokenService';
import { BadRequestError, UnauthorizedError } from '../../../core/errors/AppError';
import { logger } from '../../../config/logger';
import { UserRole } from '../../../types/database';

export class AuthService {
  async register(data: any) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestError('Email already exists', 'EMAIL_EXISTS');
    }

    const password_hash = await argon2.hash(data.password);
    const user = await userRepository.create({
      email: data.email,
      password_hash,
      role: data.role as UserRole,
    });

    // Don't auto-login after register, or we can. Let's return success message.
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async login(data: any) {
    const user = await userRepository.findByEmail(data.email);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid credentials or inactive account', 'INVALID_CREDENTIALS');
    }

    const isValid = await argon2.verify(user.password_hash, data.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials or inactive account', 'INVALID_CREDENTIALS');
    }

    const accessToken = tokenService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = await tokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(oldRefreshToken: string) {
    const { newRefreshToken, userId } = await tokenService.rotateRefreshToken(oldRefreshToken);
    const user = await userRepository.findById(userId);

    if (!user || !user.is_active) {
      await tokenService.revokeAllUserTokens(userId);
      throw new UnauthorizedError('User account is inactive or deleted', 'ACCOUNT_INACTIVE');
    }

    const accessToken = tokenService.generateAccessToken({ userId: user.id, role: user.role });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    await tokenService.revokeRefreshToken(refreshToken);
  }
}

export const authService = new AuthService();
