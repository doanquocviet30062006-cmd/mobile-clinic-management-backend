import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../config/logger';

/**
 * Request Tracker Middleware
 * - Attaches a unique trace_id (UUID) to every request
 * - Logs request completion with duration
 */
export const requestTracker = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
  req.headers['x-trace-id'] = traceId;
  res.setHeader('X-Trace-Id', traceId);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(
      {
        traceId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      },
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
};
