import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { DocumentationService } from './docs.service.js';
const service = new DocumentationService();
export const docsRoutes = Router();
docsRoutes.use(requireAuth);
docsRoutes.post('/', validate({ body: z.object({ projectId: z.string().regex(/^[a-f\d]{24}$/i), providerId: z.string().regex(/^[a-f\d]{24}$/i) }) }), async (req, res) => res.json({ markdown: await service.generate(req.user!.id, req.body.projectId, req.body.providerId) }));
