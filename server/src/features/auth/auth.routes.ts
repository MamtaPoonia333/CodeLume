import { Router } from 'express';
import { authRateLimit } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import { credentialsSchema } from './auth.schema.js';
import { login, logout, me, register } from './auth.controller.js';

export const authRoutes = Router();
authRoutes.post('/register', authRateLimit, validate({ body: credentialsSchema }), register);
authRoutes.post('/login', authRateLimit, validate({ body: credentialsSchema }), login);
authRoutes.post('/logout', logout);
authRoutes.get('/me', requireAuth, me);
