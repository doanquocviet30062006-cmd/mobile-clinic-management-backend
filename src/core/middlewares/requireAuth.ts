import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import { tokenService, TokenPayload } from '../../modules/auth/services/tokenService';

// Extend Express Request object to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header', 'MISSING_TOKEN');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(error); // tokenService throws UnauthorizedError if invalid/expired
  }
};
