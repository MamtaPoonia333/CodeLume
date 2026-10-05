import type { Request, Response } from 'express';
import { AIProvidersService } from './aiProviders.service.js';
const service = new AIProvidersService();
export const list = async (req: Request, res: Response) => res.json({ providers: await service.list(req.user!.id) });
export const create = async (req: Request, res: Response) => res.status(201).json({ provider: await service.create(req.user!.id, req.body) });
export const remove = async (req: Request, res: Response) => { await service.remove(String(req.params.id), req.user!.id); res.status(204).send(); };
