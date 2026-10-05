import { InferSchemaType, Schema, model } from 'mongoose';

export const ChatSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true }
}, { timestamps: true });

export type ChatSessionDocument = InferSchemaType<typeof ChatSessionSchema>;
export const ChatSession = model('ChatSession', ChatSessionSchema);
