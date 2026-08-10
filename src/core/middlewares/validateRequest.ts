import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../errors/AppError';

export const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new BadRequestError(`Validation failed: ${errors}`, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  };
