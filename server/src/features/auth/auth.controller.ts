import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

const service = new AuthService();
const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 };

export const register = async (req: Request, res: Response) => res.status(201).json({ user: await service.register(req.body.email, req.body.password) });
export const login = async (req: Request, res: Response) => {
  const result = await service.login(req.body.email, req.body.password);
  res.cookie('token', result.token, cookieOptions).json({ user: result.user });
};
export const logout = (_req: Request, res: Response) => res.clearCookie('token', cookieOptions).status(204).send();
export const me = (req: Request, res: Response) => res.json({ user: req.user });
