import mongoose, { Schema, Document } from 'mongoose';

export interface IBot extends Document {
  botId: string;
  apiKey: string;
  ownerId: string;
  name: string;
  description?: string;
  avatar?: string;
  isPublic: boolean;
  webhookUrl?: string;
  verified: boolean;
  verifiedAt?: Date;
  addedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

const botSchema = new Schema(
  {
    botId: { type: String, required: true, unique: true },
    apiKey: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    avatar: { type: String },
    isPublic: { type: Boolean, default: false },
    webhookUrl: { type: String },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    addedByUserId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Bot = mongoose.models.Bot || mongoose.model<IBot>('Bot', botSchema);
