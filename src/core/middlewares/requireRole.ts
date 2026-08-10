import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';
import { UserRole } from '../../types/database';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('User is not authenticated', 'UNAUTHENTICATED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        'You do not have permission to perform this action',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
};
