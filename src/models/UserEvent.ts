import mongoose, { Schema, Document } from 'mongoose';

export interface IUserEvent extends Document {
  botId: string;
  shardId: number;
  totalShards: number;
  userId: string;
  guildId?: string;
  action: string;
  timestamp: Date;
  createdAt: Date;
}

const userEventSchema = new Schema(
  {
    botId: { type: String, required: true, index: true },
    shardId: { type: Number, required: true, default: 0, index: true },
    totalShards: { type: Number, required: true, default: 1 },
    userId: { type: String, required: true, index: true },
    guildId: { type: String, index: true },
    action: { type: String, default: 'interaction' },
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

userEventSchema.index({ botId: 1, timestamp: -1 });
userEventSchema.index({ botId: 1, userId: 1, timestamp: -1 });
userEventSchema.index({ botId: 1, shardId: 1, timestamp: -1 });

export const UserEvent = mongoose.models.UserEvent || mongoose.model<IUserEvent>('UserEvent', userEventSchema);
