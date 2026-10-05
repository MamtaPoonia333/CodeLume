import { env } from '../../config/env.js';
import { AIProvider } from '../../models/aiProvider.model.js';
import { encrypt } from './crypto.js';
import { AppError } from '../../utils/errors.js';

const key = () => Buffer.from(env.ENCRYPTION_KEY, 'hex');
export class AIProvidersService {
  list(userId: string) { return AIProvider.find({ userId }).select('-apiKeyEnc').sort({ createdAt: -1 }).lean(); }
  async create(userId: string, input: { label: string; baseUrl: string; apiKey?: string; model: string }) {
    const provider = await AIProvider.create({ userId, label: input.label, baseUrl: input.baseUrl.replace(/\/$/, ''), model: input.model, apiKeyEnc: input.apiKey ? encrypt(input.apiKey, key()) : undefined });
    return { id: provider.id, userId: provider.userId, label: provider.label, baseUrl: provider.baseUrl, model: provider.model, createdAt: provider.createdAt, updatedAt: provider.updatedAt };
  }
  async remove(id: string, userId: string) {
    const result = await AIProvider.deleteOne({ _id: id, userId });
    if (!result.deletedCount) throw new AppError(404, 'PROVIDER_NOT_FOUND', 'AI provider not found');
  }
  async getConfig(id: string, userId: string) {
    const provider = await AIProvider.findOne({ _id: id, userId }).select('+apiKeyEnc');
    if (!provider) throw new AppError(404, 'PROVIDER_NOT_FOUND', 'AI provider not found');
    return { baseUrl: provider.baseUrl, model: provider.model, apiKey: provider.apiKeyEnc ? (await import('./crypto.js')).decrypt(provider.apiKeyEnc, key()) : '' };
  }
}
