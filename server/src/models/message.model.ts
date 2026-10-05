import { InferSchemaType, Schema, model } from 'mongoose';

export const MessageSchema = new Schema({
  chatSessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true }
}, { timestamps: true });

MessageSchema.index({ chatSessionId: 1, createdAt: 1 });

export type MessageDocument = InferSchemaType<typeof MessageSchema>;
export const Message = model('Message', MessageSchema);
