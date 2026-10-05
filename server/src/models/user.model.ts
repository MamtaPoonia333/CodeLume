import { InferSchemaType, Schema, model } from 'mongoose';

export const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });

export type UserDocument = InferSchemaType<typeof UserSchema>;
export const User = model('User', UserSchema);
