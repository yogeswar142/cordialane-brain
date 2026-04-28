import { z } from 'zod';

const shardMetaSchema = {
  shardId: z.number().int().nonnegative('shardId must be a non-negative integer').optional(),
  totalShards: z.number().int().positive('totalShards must be a positive integer').optional(),
};

// ─────────────────────────────────────────────────────────────
// Track Command
// ─────────────────────────────────────────────────────────────
export const trackCommandSchema = z.object({
  botId: z.string().min(1, 'botId is required'),
  command: z.string().min(1, 'command must be a non-empty string'),
  userId: z.string().optional(),
  guildId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 date string' }),
  ...shardMetaSchema,
});

// ─────────────────────────────────────────────────────────────
// Track User
// ─────────────────────────────────────────────────────────────
export const trackUserSchema = z.object({
  botId: z.string().min(1, 'botId is required'),
  userId: z.string().min(1, 'userId is required'),
  guildId: z.string().optional(),
  action: z.string().optional().default('interaction'),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 date string' }),
  ...shardMetaSchema,
});

// ─────────────────────────────────────────────────────────────
// Guild Count
// ─────────────────────────────────────────────────────────────
export const guildCountSchema = z.object({
  botId: z.string().min(1, 'botId is required'),
  count: z.number().nonnegative('count must be a non-negative number').finite(),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 date string' }),
  ...shardMetaSchema,
});

// ─────────────────────────────────────────────────────────────
// Heartbeat
// ─────────────────────────────────────────────────────────────
export const heartbeatSchema = z.object({
  botId: z.string().min(1, 'botId is required'),
  uptime: z.number().nonnegative('uptime must be a non-negative number').finite(),
  timestamp: z.string().datetime({ message: 'timestamp must be a valid ISO 8601 date string' }),
  ...shardMetaSchema,
});

// Inferred types for controller usage
export type TrackCommandInput = z.infer<typeof trackCommandSchema>;
export type TrackUserInput = z.infer<typeof trackUserSchema>;
export type GuildCountInput = z.infer<typeof guildCountSchema>;
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;

// ─────────────────────────────────────────────────────────────
// Track Batch
// ─────────────────────────────────────────────────────────────
export const trackBatchSchema = z.object({
  botId: z.string().min(1, 'botId is required'),
  shardId: z.number().int().nonnegative().optional(),
  totalShards: z.number().int().positive().optional(),
  events: z.array(z.any()).min(1, 'events array must not be empty')
});

export type TrackBatchInput = z.infer<typeof trackBatchSchema>;
