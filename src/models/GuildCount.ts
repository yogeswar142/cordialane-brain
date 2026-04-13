import mongoose, { Schema, Document } from 'mongoose';

export interface IGuildCount extends Document {
  botId: string;
  count: number;
  timestamp: Date;
  createdAt: Date;
}

const guildCountSchema = new Schema(
  {
    botId: { type: String, required: true, index: true },
    count: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

guildCountSchema.index({ botId: 1, timestamp: -1 });

export const GuildCount = mongoose.models.GuildCount || mongoose.model<IGuildCount>('GuildCount', guildCountSchema);
