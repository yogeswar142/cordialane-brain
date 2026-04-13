import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * In-memory rate limiter per API key.
 * Default: 120 requests per minute per bot.
 */
export function rateLimiter(maxRequests = 120, windowMs = 60_000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Use the bot's API key as the rate limit key
    const apiKey = req.headers.authorization?.split(' ')[1] || req.ip || 'unknown';
    const now = Date.now();

    let entry = store.get(apiKey);

    if (!entry || now > entry.resetAt) {
      // New window
      entry = { count: 1, resetAt: now + windowMs };
      store.set(apiKey, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (entry.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
}
