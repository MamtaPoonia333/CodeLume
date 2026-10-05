import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.token;
  if (!token) return next(new AppError(401, 'AUTH_REQUIRED', 'Authentication is required'));

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return next(new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid'));
    }
    req.user = { id: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined };
    next();
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Authentication token is invalid or expired'));
  }
};
