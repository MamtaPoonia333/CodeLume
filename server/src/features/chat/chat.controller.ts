import type { Request, Response } from 'express';
import { ChatService } from './chat.service.js';
const service = new ChatService();
export const send = async (req: Request, res: Response) => res.json(await service.send(req.user!.id, String(req.params.projectId), req.body.message, req.body.providerId, req.body.sessionId));
export const messages = async (req: Request, res: Response) => res.json({ messages: await service.messages(req.user!.id, String(req.params.id)) });
