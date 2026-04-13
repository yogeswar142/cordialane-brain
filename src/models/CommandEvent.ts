import mongoose, { Schema, Document } from 'mongoose';

export interface ICommandEvent extends Document {
  botId: string;
  command: string;
  userId?: string;
  guildId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

const commandEventSchema = new Schema(
  {
    botId: { type: String, required: true, index: true },
    command: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    guildId: { type: String, index: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Compound indexes for dashboard query performance
commandEventSchema.index({ botId: 1, timestamp: -1 });
commandEventSchema.index({ botId: 1, command: 1 });

export const CommandEvent = mongoose.models.CommandEvent || mongoose.model<ICommandEvent>('CommandEvent', commandEventSchema);
