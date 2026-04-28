import { Request, Response } from 'express';
import { Bot, CommandEvent, UserEvent, GuildCount, Heartbeat } from '../models';
import type { TrackCommandInput, TrackUserInput, GuildCountInput, HeartbeatInput, TrackBatchInput } from '../validators/schemas';

const VERIFICATION_THRESHOLD = 5;
const DEFAULT_SHARD_ID = 0;
const DEFAULT_TOTAL_SHARDS = 1;

type ShardMetaInput = {
  shardId?: number;
  totalShards?: number;
};

type NormalizedShardMeta = {
  shardId: number;
  totalShards: number;
};

const normalizeShardMeta = (input: ShardMetaInput): NormalizedShardMeta => ({
  shardId: Number.isInteger(input.shardId) ? (input.shardId as number) : DEFAULT_SHARD_ID,
  totalShards: Number.isInteger(input.totalShards) && (input.totalShards as number) > 0
    ? (input.totalShards as number)
    : DEFAULT_TOTAL_SHARDS,
});

const getAuthenticatedBotId = (req: Request): string | null => {
  const authBotId = (req as any).bot?.botId as string | undefined;
  return authBotId ?? null;
};

const resolveBotId = (req: Request, bodyBotId: string): { botId: string; mismatch: boolean } => {
  const authBotId = getAuthenticatedBotId(req);
  if (!authBotId) {
    return { botId: bodyBotId, mismatch: false };
  }

  if (bodyBotId && bodyBotId !== authBotId) {
    return { botId: authBotId, mismatch: true };
  }

  return { botId: authBotId, mismatch: false };
};

const upsertBotShardSnapshot = async (
  botId: string,
  shardId: number,
  totalShards: number,
  patch: Partial<{ status: 'online' | 'lagging' | 'offline'; lastHeartbeat: Date; latencyMs: number; guildCount: number }>
) => {
  if (Object.keys(patch).length === 0) return;

  const setOps: Record<string, unknown> = {
    'shards.$[shard].totalShards': totalShards,
  };
  Object.entries(patch).forEach(([field, value]) => {
    setOps[`shards.$[shard].${field}`] = value;
  });

  // Auto-reset alertedOffline when shard comes back online
  if (patch.status === 'online') {
    setOps['shards.$[shard].alertedOffline'] = false;
  }

  try {
    const updated = await Bot.updateOne(
      { botId, shards: { $exists: true } },
      { $set: setOps },
      { arrayFilters: [{ 'shard.id': shardId }] }
    );

    if (updated.matchedCount > 0 && updated.modifiedCount > 0) return;
  } catch (err: any) {
    // If the path still doesn't exist or other mongo error, fall through to push logic
    console.error(`[Upsert Error] Falling back for bot ${botId}:`, err.message);
  }

  await Bot.updateOne(
    { botId, 'shards.id': { $ne: shardId } },
    {
      $push: {
        shards: {
          id: shardId,
          totalShards,
          status: patch.status ?? 'online',
          lastHeartbeat: patch.lastHeartbeat,
          latencyMs: patch.latencyMs,
          guildCount: patch.guildCount,
          alertedOffline: false,
        }
      }
    }
  );
};

/**
 * Increments API call count and auto-verifies the bot once it reaches
 * the verification threshold (5 API calls). This proves the developer
 * actually owns and operates the bot.
 */
const incrementApiCallsAndVerify = async (botId: string, amount: number = 1) => {
  try {
    // Atomic increment of apiCallCount
    const bot = await Bot.findOneAndUpdate(
      { botId },
      { $inc: { apiCallCount: amount } },
      { returnDocument: 'after' }
    );

    if (!bot) return;

    // Log the API call with bot name for monitoring
    console.log(`[API Call] Bot: ${bot.name} (${botId}) | Increment: ${amount}`);

    // Auto-verify once threshold is reached (only if not already verified)
    if (!bot.verified && bot.apiCallCount >= VERIFICATION_THRESHOLD) {
      await Bot.updateOne(
        { botId, verified: false },
        { $set: { verified: true, verifiedAt: new Date() } }
      );
      console.log(`✅ Bot ${botId} (${bot.name}) auto-verified after ${bot.apiCallCount} API calls`);
    }
  } catch (err) {
    console.error("Error incrementing API calls / verifying bot:", err);
  }
};

export const trackCommand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { botId: bodyBotId, command, userId, guildId, metadata, timestamp, shardId, totalShards } = req.body as TrackCommandInput;
    const { botId, mismatch } = resolveBotId(req, bodyBotId);
    if (mismatch) {
      res.status(400).json({ success: false, error: 'botId in body must match authenticated bot id' });
      return;
    }
    const normalizedShard = normalizeShardMeta({ shardId, totalShards });

    await CommandEvent.create({
      botId,
      shardId: normalizedShard.shardId,
      totalShards: normalizedShard.totalShards,
      command,
      userId,
      guildId,
      metadata,
      timestamp: new Date(timestamp)
    });

    await incrementApiCallsAndVerify(botId);

    res.status(200).json({ success: true, message: 'Command event tracked' });
  } catch (error) {
    console.error('Error tracking command:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const trackUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { botId: bodyBotId, userId, guildId, action, timestamp, shardId, totalShards } = req.body as TrackUserInput;
    const { botId, mismatch } = resolveBotId(req, bodyBotId);
    if (mismatch) {
      res.status(400).json({ success: false, error: 'botId in body must match authenticated bot id' });
      return;
    }
    const normalizedShard = normalizeShardMeta({ shardId, totalShards });

    await UserEvent.create({
      botId,
      shardId: normalizedShard.shardId,
      totalShards: normalizedShard.totalShards,
      userId,
      guildId,
      action,
      timestamp: new Date(timestamp)
    });

    await incrementApiCallsAndVerify(botId);

    res.status(200).json({ success: true, message: 'User event tracked' });
  } catch (error) {
    console.error('Error tracking user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const postGuildCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { botId: bodyBotId, count, timestamp, shardId, totalShards } = req.body as GuildCountInput;
    const { botId, mismatch } = resolveBotId(req, bodyBotId);
    if (mismatch) {
      res.status(400).json({ success: false, error: 'botId in body must match authenticated bot id' });
      return;
    }
    const normalizedShard = normalizeShardMeta({ shardId, totalShards });
    const ts = new Date(timestamp);

    await GuildCount.create({
      botId,
      shardId: normalizedShard.shardId,
      totalShards: normalizedShard.totalShards,
      count,
      timestamp: ts
    });
    await upsertBotShardSnapshot(botId, normalizedShard.shardId, normalizedShard.totalShards, { guildCount: count });

    await incrementApiCallsAndVerify(botId);

    res.status(200).json({ success: true, message: 'Guild count updated' });
  } catch (error) {
    console.error('Error updating guild count:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const heartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { botId: bodyBotId, uptime, timestamp, shardId, totalShards } = req.body as HeartbeatInput;
    const { botId, mismatch } = resolveBotId(req, bodyBotId);
    if (mismatch) {
      res.status(400).json({ success: false, error: 'botId in body must match authenticated bot id' });
      return;
    }
    const normalizedShard = normalizeShardMeta({ shardId, totalShards });
    const ts = new Date(timestamp);
    const latencyMs = Math.max(0, Date.now() - ts.getTime());
    const status = latencyMs > 120000 ? 'offline' : latencyMs > 30000 ? 'lagging' : 'online';

    await Heartbeat.create({
      botId,
      shardId: normalizedShard.shardId,
      totalShards: normalizedShard.totalShards,
      uptime,
      timestamp: ts
    });
    await upsertBotShardSnapshot(botId, normalizedShard.shardId, normalizedShard.totalShards, {
      lastHeartbeat: ts,
      latencyMs,
      status,
    });

    await incrementApiCallsAndVerify(botId);

    res.status(200).json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const trackBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { botId: bodyBotId, events, shardId: rootShardId, totalShards: rootTotalShards } = req.body as TrackBatchInput & ShardMetaInput;
    const { botId, mismatch } = resolveBotId(req, bodyBotId);
    if (mismatch) {
      res.status(400).json({ success: false, error: 'botId in body must match authenticated bot id' });
      return;
    }
    
    if (!events || events.length === 0) {
      res.status(200).json({ success: true, message: 'Empty batch' });
      return;
    }

    const commands: any[] = [];
    const users: any[] = [];
    const guildCounts: any[] = [];
    const heartbeats: any[] = [];

    // Simple anti-spam: track unique users in this batch to prevent duplicates
    const uniqueUsersInBatch = new Set<string>();

    for (const event of events) {
      const normalizedShard = normalizeShardMeta({
        shardId: event.shardId ?? rootShardId,
        totalShards: event.totalShards ?? rootTotalShards,
      });
      const eventTimestamp = event.timestamp ? new Date(event.timestamp) : new Date();
      // Add botId and parse timestamp
      const data = {
        ...event,
        botId,
        shardId: normalizedShard.shardId,
        totalShards: normalizedShard.totalShards,
        timestamp: eventTimestamp,
      };
      
      if (event.type === 'command') {
        commands.push(data);
      } else if (event.type === 'user' || (event.userId && event.action)) {
        // Only add if we haven't seen this user in this specific batch yet
        if (!uniqueUsersInBatch.has(data.userId)) {
          users.push(data);
          uniqueUsersInBatch.add(data.userId);
        }
      } else if (event.type === 'guildCount' || event.count !== undefined) {
        guildCounts.push(data);
        await upsertBotShardSnapshot(botId, normalizedShard.shardId, normalizedShard.totalShards, {
          guildCount: Number(event.count) || 0,
        });
      } else if (event.type === 'heartbeat' || event.uptime !== undefined) {
        heartbeats.push(data);
        const latencyMs = Math.max(0, Date.now() - eventTimestamp.getTime());
        const status = latencyMs > 120000 ? 'offline' : latencyMs > 30000 ? 'lagging' : 'online';
        await upsertBotShardSnapshot(botId, normalizedShard.shardId, normalizedShard.totalShards, {
          lastHeartbeat: eventTimestamp,
          latencyMs,
          status,
        });
      }
    }

    const promises = [];
    if (commands.length > 0) promises.push(CommandEvent.insertMany(commands));
    if (users.length > 0) promises.push(UserEvent.insertMany(users));
    if (guildCounts.length > 0) promises.push(GuildCount.insertMany(guildCounts));
    if (heartbeats.length > 0) promises.push(Heartbeat.insertMany(heartbeats));

    await Promise.all(promises);
    await incrementApiCallsAndVerify(botId, events.length);

    res.status(200).json({ success: true, message: `Batch processed ${events.length} events` });
  } catch (error) {
    console.error('Error tracking batch:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

type ShardSnapshot = {
  id: number;
  totalShards: number;
  status: 'online' | 'lagging' | 'offline';
  lastHeartbeat?: Date;
  latencyMs?: number;
  guildCount?: number;
  alertedOffline?: boolean;
};

export const getBotSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestedBotId = req.params.id;
    const authBotId = (req as any).bot?.botId as string | undefined;

    if (!requestedBotId) {
      res.status(400).json({ success: false, error: 'bot id is required' });
      return;
    }

    // Keep summary reads scoped to the authenticated bot.
    if (authBotId && requestedBotId !== authBotId) {
      res.status(403).json({ success: false, error: 'forbidden for requested bot id' });
      return;
    }

    const bot = await Bot.findOne({ botId: requestedBotId }).lean() as { botId: string; shards?: ShardSnapshot[] } | null;
    if (!bot) {
      res.status(404).json({ success: false, error: 'bot not found' });
      return;
    }

    let shards = Array.isArray(bot.shards) ? bot.shards : [];

    // Legacy fallback for bots that never wrote shard snapshots.
    if (shards.length === 0) {
      const [latestHeartbeat, latestGuildCount] = await Promise.all([
        Heartbeat.findOne({ botId: requestedBotId }).sort({ timestamp: -1 }).lean() as Promise<{ timestamp: Date } | null>,
        GuildCount.findOne({ botId: requestedBotId }).sort({ timestamp: -1 }).lean() as Promise<{ count: number } | null>,
      ]);

      const lastHeartbeat = latestHeartbeat?.timestamp;
      const latencyMs = lastHeartbeat ? Math.max(0, Date.now() - new Date(lastHeartbeat).getTime()) : undefined;
      const status: 'online' | 'lagging' | 'offline' = !latencyMs
        ? 'offline'
        : latencyMs > 120000
          ? 'offline'
          : latencyMs > 30000
            ? 'lagging'
            : 'online';

      shards = [{
        id: 0,
        totalShards: 1,
        status,
        lastHeartbeat,
        latencyMs,
        guildCount: latestGuildCount?.count ?? 0,
      }];
    }

    const totalGuildCount = shards.reduce((sum, shard) => sum + (shard.guildCount ?? 0), 0);
    const onlineShards = shards.filter((s) => s.status === 'online').length;
    const laggingShards = shards.filter((s) => s.status === 'lagging').length;
    const offlineShards = shards.filter((s) => s.status === 'offline').length;

    const healthStatus: 'operational' | 'partial_outage' | 'major_outage' =
      offlineShards === shards.length
        ? 'major_outage'
        : offlineShards > 0 || laggingShards > 0
          ? 'partial_outage'
          : 'operational';

    // ─── Aggregated Quick Stats (computed in parallel) ───
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [commandsWeekly, activeUserIds, heartbeatsToday, commandsByDateAgg] = await Promise.all([
      CommandEvent.countDocuments({ botId: requestedBotId, timestamp: { $gte: oneWeekAgo } }),
      UserEvent.distinct('userId', { botId: requestedBotId, timestamp: { $gte: oneDayAgo } }),
      Heartbeat.countDocuments({ botId: requestedBotId, timestamp: { $gte: oneDayAgo } }),
      CommandEvent.aggregate([
        { $match: { botId: requestedBotId, timestamp: { $gte: oneWeekAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const dau = activeUserIds.length;
    const configuredShardCount = Math.max(1, shards.length);
    const expectedHeartbeatsPerDay = 2880 * configuredShardCount;
    const uptimePercent = heartbeatsToday >= expectedHeartbeatsPerDay
      ? 100
      : parseFloat(((heartbeatsToday / expectedHeartbeatsPerDay) * 100).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        botId: requestedBotId,
        totalGuildCount,
        healthStatus,
        shardCounts: {
          online: onlineShards,
          lagging: laggingShards,
          offline: offlineShards,
          total: shards.length,
        },
        shards,
        quickStats: {
          commandsWeekly,
          dau,
          uptimePercent,
          heartbeatsToday,
        },
        commandsByDate: commandsByDateAgg.map((c: any) => ({
          date: c._id,
          commands: c.count,
        })),
      },
    });
  } catch (error) {
    console.error('Error building bot summary:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
