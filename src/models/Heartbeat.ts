import mongoose, { Schema, Document } from 'mongoose';

export interface IHeartbeat extends Document {
  botId: string;
  uptime: number;
  timestamp: Date;
  createdAt: Date;
}

const heartbeatSchema = new Schema(
  {
    botId: { type: String, required: true, index: true },
    uptime: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

heartbeatSchema.index({ botId: 1, timestamp: -1 });

export const Heartbeat = mongoose.models.Heartbeat || mongoose.model<IHeartbeat>('Heartbeat', heartbeatSchema);
