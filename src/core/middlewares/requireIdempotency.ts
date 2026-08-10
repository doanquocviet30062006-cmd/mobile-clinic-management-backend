import { Request, Response, NextFunction } from 'express';
import { redisCache } from '../../config/redis';
import { ConflictError, BadRequestError } from '../errors/AppError';

export const requireIdempotency = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      throw new BadRequestError('Idempotency-Key header is required for this action');
    }

    // Key valid for 24 hours
    const ttl = 86400;
    const redisKey = `idempotency:${idempotencyKey}`;

    // SETNX (Set if Not eXists)
    // ioredis set returns 'OK' if set, null if already exists
    const result = await redisCache.set(redisKey, 'LOCKED', 'EX', ttl, 'NX');

    if (result !== 'OK') {
      throw new ConflictError(
        'Duplicate request detected. Please wait for the previous request to complete.',
        'DUPLICATE_REQUEST'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
