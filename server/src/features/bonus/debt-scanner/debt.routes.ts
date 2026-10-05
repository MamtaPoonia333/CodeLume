import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { DebtService } from './debt.service.js';
const service = new DebtService();
export const debtRoutes = Router();
debtRoutes.use(requireAuth);
debtRoutes.get('/:projectId', validate({ params: z.object({ projectId: z.string().regex(/^[a-f\d]{24}$/i) }) }), async (req, res) => res.json({ findings: await service.scan(req.user!.id, String(req.params.projectId)) }));
