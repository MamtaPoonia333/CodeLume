import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/, 'ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters'),
  CLIENT_URL: z.string().url()
});

export const env = envSchema.parse(process.env);
