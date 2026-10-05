import type { RequestHandler } from 'express';
import { z, type ZodTypeAny } from 'zod';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validate = (schemas: RequestSchemas): RequestHandler => (req, _res, next) => {
  const parsed: Record<string, unknown> = {};
  try {
    if (schemas.body) parsed.body = schemas.body.parse(req.body);
    if (schemas.params) parsed.params = schemas.params.parse(req.params);
    if (schemas.query) parsed.query = schemas.query.parse(req.query);
    Object.assign(req, parsed);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) return next(error);
    next(error);
  }
};
