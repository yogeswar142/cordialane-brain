import { Request, Response } from 'express';
import { Bot, CommandEvent, UserEvent, GuildCount, Heartbeat } from '../models';
import type { TrackCommandInput, TrackUserInput, GuildCountInput, HeartbeatInput } from '../validators/schemas';

const VERIFICATION_THRESHOLD = 5;

/**
 * Increments API call count and auto-verifies the bot once it reaches
 * the verification threshold (5 API calls). This proves the developer
 * actually owns and operates the bot.
 */
const incrementApiCallsAndVerify = async (botId: string) => {
  try {
    // Atomic increment of apiCallCount
    const bot = await Bot.findOneAndUpdate(
      { botId },
      { $inc: { apiCallCount: 1 } },
      { new: true }
    );

    if (!bot) return;

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
    const { botId, command, userId, guildId, metadata, timestamp } = req.body as TrackCommandInput;

    await CommandEvent.create({
      botId,
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
    const { botId, userId, guildId, action, timestamp } = req.body as TrackUserInput;

    await UserEvent.create({
      botId,
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
    const { botId, count, timestamp } = req.body as GuildCountInput;

    await GuildCount.create({
      botId,
      count,
      timestamp: new Date(timestamp)
    });

    await incrementApiCallsAndVerify(botId);

    res.status(200).json({ success: true, message: 'Guild count updated' });
  } catch (error) {
    console.error('Error updating guild count:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const heartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { botId, uptime, timestamp } = req.body as HeartbeatInput;

    await Heartbeat.create({
      botId,
      uptime,
      timestamp: new Date(timestamp)
    });

    await incrementApiCallsAndVerify(botId);

    res.status(200).json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
