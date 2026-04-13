import { Request, Response } from 'express';
import { CommandEvent, UserEvent, GuildCount, Heartbeat } from '../models';
import type { TrackCommandInput, TrackUserInput, GuildCountInput, HeartbeatInput } from '../validators/schemas';

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

    res.status(200).json({ success: true, message: 'Heartbeat received' });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
