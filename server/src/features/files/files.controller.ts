import type { Request, Response } from 'express';
import { FilesService } from './files.service.js';
const service = new FilesService();
export const upload = async (req: Request, res: Response) => res.status(201).json({ files: await service.upload(String(req.params.id), req.user!.id, req.file!.buffer) });
export const list = async (req: Request, res: Response) => res.json({ files: await service.list(String(req.params.id), req.user!.id) });
export const tree = async (req: Request, res: Response) => res.json({ tree: await service.tree(String(req.params.id), req.user!.id) });
export const content = async (req: Request, res: Response) => { const file = await service.content(String(req.params.fileId), req.user!.id); res.type('text/plain').send(file.content); };
export const remove = async (req: Request, res: Response) => { await service.remove(String(req.params.fileId), req.user!.id); res.status(204).send(); };
