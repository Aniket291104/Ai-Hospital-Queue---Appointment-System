import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

export interface RequestSchema {
  body?: ZodObject<any, any>;
  query?: ZodObject<any, any>;
  params?: ZodObject<any, any>;
}

export const validateRequest = (schema: RequestSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new BadRequestError('Validation failed', errors));
      }
      next(error);
    }
  };
};
