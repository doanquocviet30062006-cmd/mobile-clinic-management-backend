import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../../config/logger';

/**
 * Global Error Handler Middleware
 * Must be registered LAST in the Express middleware chain.
 *
 * - AppError (operational) → logs as WARN, returns structured JSON
 * - Unknown errors         → logs as ERROR with stack, returns generic 500
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const traceId = (req.headers['x-trace-id'] as string) || 'unknown';

  if (err instanceof AppError) {
    // Operational error - expected, log as warning
    logger.warn(
      {
        traceId,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        path: req.originalUrl,
        method: req.method,
      },
      `Operational Error: ${err.message}`
    );

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        traceId,
      },
    });
    return;
  }

  // Programming/unknown error - unexpected, log as error with stack
  logger.error(
    {
      traceId,
      err, // Pino serializes the error object safely (name, message, stack)
      path: req.originalUrl,
      method: req.method,
    },
    'Unexpected Internal Error'
  );

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      traceId,
    },
  });
};
