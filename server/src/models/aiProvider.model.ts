import { InferSchemaType, Schema, model } from 'mongoose';

export const AiProviderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label: { type: String, required: true, trim: true },
  baseUrl: { type: String, required: true, trim: true },
  apiKeyEnc: { type: String, select: false },
  model: { type: String, required: true, trim: true }
}, { timestamps: true });

export type AiProviderDocument = InferSchemaType<typeof AiProviderSchema>;
export const AIProvider = model('AiProvider', AiProviderSchema);
