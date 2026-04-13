import { Router } from 'express';
import { requireApiKey } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { trackCommandSchema, trackUserSchema, guildCountSchema, heartbeatSchema } from '../../validators/schemas';
import { trackCommand, trackUser, postGuildCount, heartbeat } from '../../controllers/analytics.controller';

const router = Router();

// Apply the API Key middleware to all analytics routes
router.use(requireApiKey);

// Routes with Zod validation middleware applied before controllers
router.post('/track-command', validate(trackCommandSchema), trackCommand);
router.post('/track-user', validate(trackUserSchema), trackUser);
router.post('/guild-count', validate(guildCountSchema), postGuildCount);
router.post('/heartbeat', validate(heartbeatSchema), heartbeat);

export default router;
