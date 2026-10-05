import type { Request, Response } from 'express';
import { ProjectsService } from './projects.service.js';
const service = new ProjectsService();
export const list = async (req: Request, res: Response) => res.json({ projects: await service.list(req.user!.id) });
export const create = async (req: Request, res: Response) => res.status(201).json({ project: await service.create(req.user!.id, req.body) });
export const get = async (req: Request, res: Response) => res.json({ project: await service.getOwned(String(req.params.id), req.user!.id) });
export const update = async (req: Request, res: Response) => res.json({ project: await service.update(String(req.params.id), req.user!.id, req.body) });
export const remove = async (req: Request, res: Response) => { await service.remove(String(req.params.id), req.user!.id); res.status(204).send(); };
