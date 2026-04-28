import mongoose, { Schema, Document } from 'mongoose';

export interface IGuildCount extends Document {
  botId: string;
  shardId: number;
  totalShards: number;
  count: number;
  timestamp: Date;
  createdAt: Date;
}

const guildCountSchema = new Schema(
  {
    botId: { type: String, required: true, index: true },
    shardId: { type: Number, required: true, default: 0, index: true },
    totalShards: { type: Number, required: true, default: 1 },
    count: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

guildCountSchema.index({ botId: 1, timestamp: -1 });
guildCountSchema.index({ botId: 1, shardId: 1, timestamp: -1 });

export const GuildCount = mongoose.models.GuildCount || mongoose.model<IGuildCount>('GuildCount', guildCountSchema);
