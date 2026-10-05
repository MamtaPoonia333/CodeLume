import { performanceTemplate } from './performance.js';
import { qualityTemplate } from './quality.js';
import { securityTemplate } from './security.js';

export const reviewTemplates = {
  security: securityTemplate,
  performance: performanceTemplate,
  quality: qualityTemplate
} as const;
