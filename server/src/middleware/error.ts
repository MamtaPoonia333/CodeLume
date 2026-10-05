import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AppError } from '../utils/errors.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
  }
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: error.flatten() } });
  }
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: { code: error.code, message: error.message } });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ error: { code: 'MODEL_VALIDATION_ERROR', message: error.message } });
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
};
