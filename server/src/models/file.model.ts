import { InferSchemaType, Schema, model } from 'mongoose';

export const FileSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  path: { type: String, required: true, trim: true },
  language: { type: String, trim: true },
  sizeBytes: { type: Number, required: true, min: 0 },
  content: { type: String, required: true }
}, { timestamps: true });

FileSchema.index({ projectId: 1, path: 1 }, { unique: true });
FileSchema.index(
  { path: 'text', content: 'text' },
  { language_override: 'textLanguage' }
);

export type FileDocument = InferSchemaType<typeof FileSchema>;
export const File = model('File', FileSchema);
