import { InferSchemaType, Schema, model } from 'mongoose';

export const ProjectSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true }
}, { timestamps: true });

export type ProjectDocument = InferSchemaType<typeof ProjectSchema>;
export const Project = model('Project', ProjectSchema);
