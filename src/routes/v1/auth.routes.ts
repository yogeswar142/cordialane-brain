import { Router } from 'express';
import { requireApiKey } from '../../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/auth/verify
 * @desc    Verify if the provided API Key and Bot ID are valid.
 *          This is used by SDKs during initialization for a startup handshake.
 * @access  Private (requires x-bot-id and Authorization: Bearer <key>)
 */
router.get('/verify', requireApiKey, (req, res) => {
  // If the request reaches here, the requireApiKey middleware has already verified the bot.
  res.status(200).json({
    success: true,
    message: 'Configuration verified successfully',
    botId: (req as any).bot.botId,
    botName: (req as any).bot.name,
    versioning: {
      latestSdkVersion: '1.2.2',
      minRecommendedVersion: '1.2.1'
    }
  });
});

export default router;
