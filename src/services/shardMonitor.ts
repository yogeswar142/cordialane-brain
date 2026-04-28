import { Bot } from '../models';

// ─────────────────────────────────────────────────────────────
// Shard Monitor — Background Webhook Alert System
// ─────────────────────────────────────────────────────────────
// Checks all bots with a configured webhookUrl every 60 seconds.
// If a shard's lastHeartbeat is older than 2 minutes, it sends
// a Discord webhook alert. When the shard recovers, it sends
// a recovery notification.
// ─────────────────────────────────────────────────────────────

const OFFLINE_THRESHOLD_MS = 120_000; // 2 minutes — matches heartbeat status logic
const CHECK_INTERVAL_MS = 60_000;     // Run every 60 seconds
const ALERT_COOLDOWN_MS = 300_000;    // 5 minute minimum between re-alerts for same shard

/**
 * Sends a message to a Discord webhook endpoint.
 * Silently catches errors to avoid crashing the monitor loop.
 */
const sendDiscordWebhook = async (
  webhookUrl: string,
  embeds: Record<string, unknown>[]
): Promise<boolean> => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds }),
    });

    if (!response.ok) {
      console.warn(`[Shard Monitor] Webhook returned ${response.status} for ${webhookUrl}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Shard Monitor] Failed to send webhook:', err);
    return false;
  }
};

/**
 * Builds a rich Discord embed for a shard going offline.
 */
const buildOfflineEmbed = (botName: string, shardId: number, totalShards: number, lastHeartbeat?: Date) => ({
  title: '🚨 Shard Offline Alert',
  description: `**Shard #${shardId}** of **${botName}** has gone offline!`,
  color: 0xFF4444,
  fields: [
    { name: 'Bot', value: botName, inline: true },
    { name: 'Shard', value: `#${shardId} of ${totalShards}`, inline: true },
    {
      name: 'Last Heartbeat',
      value: lastHeartbeat
        ? `<t:${Math.floor(new Date(lastHeartbeat).getTime() / 1000)}:R>`
        : 'Never received',
      inline: true,
    },
    {
      name: 'Action Required',
      value: 'Check your bot process and restart the shard if needed.',
      inline: false,
    },
  ],
  timestamp: new Date().toISOString(),
  footer: { text: 'Cordia Shard Monitor • Automated Alert' },
});

/**
 * Builds a rich Discord embed for a shard recovering.
 */
const buildRecoveryEmbed = (botName: string, shardId: number, totalShards: number) => ({
  title: '✅ Shard Recovery',
  description: `**Shard #${shardId}** of **${botName}** is back online!`,
  color: 0x00CC88,
  fields: [
    { name: 'Bot', value: botName, inline: true },
    { name: 'Shard', value: `#${shardId} of ${totalShards}`, inline: true },
    { name: 'Status', value: '🟢 Online', inline: true },
  ],
  timestamp: new Date().toISOString(),
  footer: { text: 'Cordia Shard Monitor • Automated Alert' },
});

/**
 * Core monitoring tick — runs once per interval.
 * Scans all bots with webhooks and checks shard health.
 */
const runHealthCheck = async (): Promise<void> => {
  try {
    // Only query bots that have a webhook configured and at least one shard
    const bots = await Bot.find({
      webhookUrl: { $exists: true, $ne: '' },
      'shards.0': { $exists: true },
    }).lean() as any[];

    const now = Date.now();

    for (const bot of bots) {
      const shards = bot.shards || [];
      if (!bot.webhookUrl) continue;

      for (const shard of shards) {
        const lastHbTime = shard.lastHeartbeat
          ? new Date(shard.lastHeartbeat).getTime()
          : 0;
        const elapsed = now - lastHbTime;
        const isCurrentlyOffline = elapsed > OFFLINE_THRESHOLD_MS;

        if (isCurrentlyOffline && !shard.alertedOffline) {
          // ─── SHARD WENT OFFLINE — Send alert ───
          const embed = buildOfflineEmbed(
            bot.name,
            shard.id,
            shard.totalShards,
            shard.lastHeartbeat
          );

          const sent = await sendDiscordWebhook(bot.webhookUrl, [embed]);

          if (sent) {
            // Mark shard as alerted + offline in DB
            await Bot.updateOne(
              { botId: bot.botId },
              {
                $set: {
                  'shards.$[shard].alertedOffline': true,
                  'shards.$[shard].status': 'offline',
                },
              },
              { arrayFilters: [{ 'shard.id': shard.id }] }
            );
            console.log(`🚨 [Shard Monitor] Alert sent: Shard #${shard.id} of "${bot.name}" is offline`);
          }
        } else if (!isCurrentlyOffline && shard.alertedOffline) {
          // ─── SHARD RECOVERED — Send recovery notification ───
          const embed = buildRecoveryEmbed(bot.name, shard.id, shard.totalShards);

          const sent = await sendDiscordWebhook(bot.webhookUrl, [embed]);

          if (sent) {
            // Reset the alert flag
            await Bot.updateOne(
              { botId: bot.botId },
              {
                $set: {
                  'shards.$[shard].alertedOffline': false,
                  'shards.$[shard].status': 'online',
                },
              },
              { arrayFilters: [{ 'shard.id': shard.id }] }
            );
            console.log(`✅ [Shard Monitor] Recovery: Shard #${shard.id} of "${bot.name}" is back online`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Shard Monitor] Error during health check:', err);
  }
};

/**
 * Starts the background shard monitor loop.
 * Call this once after MongoDB is connected.
 */
export const startShardMonitor = (): void => {
  console.log('🔍 Shard Monitor started (checking every 60s for offline shards)');

  // Run first check after a short delay to let the server stabilize
  setTimeout(() => {
    runHealthCheck();
  }, 5000);

  // Then run on interval
  setInterval(runHealthCheck, CHECK_INTERVAL_MS);
};
