import { Request, Response, NextFunction } from 'express';
import { Bot } from '../models';

export const requireApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const botId = req.headers['x-bot-id'] as string; // Cordia SDK sends this

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       res.status(401).json({ success: false, error: 'Authorization header missing or invalid format (Bearer token required)' });
       return;
    }

    if (!botId) {
      res.status(400).json({ success: false, error: 'X-Bot-Id header is required' });
      return;
    }

    const apiKey = authHeader.split(' ')[1];

    // Find bot by botId and apiKey
    const bot = await Bot.findOne({ botId, apiKey });

    if (!bot) {
       res.status(401).json({ success: false, error: 'Invalid API Key or Bot ID' });
       return;
    }

    // Attach bot to request for downstream usage
    (req as any).bot = bot;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
};
