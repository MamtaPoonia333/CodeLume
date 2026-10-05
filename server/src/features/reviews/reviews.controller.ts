import type { Request, Response } from 'express';
import { ReviewsService } from './reviews.service.js';
const service = new ReviewsService();
export const create = async (req: Request, res: Response) => res.status(201).json({ review: await service.create(req.user!.id, req.body) });
export const list = async (req: Request, res: Response) => res.json({ reviews: await service.list(req.user!.id, req.query.projectId as string, req.query.q as string | undefined) });
export const get = async (req: Request, res: Response) => res.json({ review: await service.get(req.user!.id, String(req.params.id)) });
