import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose / Zod / Prisma / DB errors can be caught here and transformed to AppError
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    });
  }

  // Fallback for unhandled errors
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    errorCode: 'ERR_INTERNAL_SERVER',
  });
};
