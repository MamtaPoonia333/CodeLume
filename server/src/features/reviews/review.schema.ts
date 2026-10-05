import { z } from 'zod';
export const reviewOutputSchema = z.object({
  summary: z.string(),
  issues: z.array(z.object({
    title: z.string().optional(),
    description: z.string(),
    file: z.string().optional(),
    line: z.number().int().positive().optional(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional()
  })),
  recommendations: z.array(z.string()),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional()
});
