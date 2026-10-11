import { InferSchemaType, Schema, model } from 'mongoose';

const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const IssueSchema = new Schema({
  title: { type: String, trim: true },
  description: { type: String, required: true },
  file: { type: String, trim: true },
  line: { type: Number, min: 1 },
  severity: { type: String, enum: severities }
}, { _id: false });

export const ReviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  scope: { type: String, enum: ['SINGLE_FILE', 'MULTI_FILE', 'PROJECT'], required: true },
  template: { type: String, enum: ['SECURITY', 'PERFORMANCE', 'QUALITY'], required: true },
  fileIds: [{ type: Schema.Types.ObjectId, ref: 'File' }],
  summary: { type: String, trim: true },
  issues: [IssueSchema],
  recommendations: [{ type: String, trim: true }],
  severity: { type: String, enum: severities },
  status: { type: String, enum: ['pending', 'processing', 'complete', 'failed'], default: 'pending', required: true },
  error: { type: String, trim: true }
}, { timestamps: true });

ReviewSchema.index({ summary: 'text', 'issues.description': 'text' });
ReviewSchema.index({ projectId: 1, createdAt: -1 });

export type ReviewDocument = InferSchemaType<typeof ReviewSchema>;
export const Review = model('Review', ReviewSchema);
