import type { RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validate = (schemas: RequestSchemas): RequestHandler => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
    next();
  } catch (error) {
    if (error instanceof z.ZodError) return next(error);
    next(error);
  }
};
