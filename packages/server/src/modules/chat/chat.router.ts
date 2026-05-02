import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { getMessagesController, createMessageController, toggleReactionController } from './chat.controller';

const router = Router();

router.use(authMiddleware);

router.get('/logs/:logId/messages', asyncHandler(getMessagesController));
router.post('/logs/:logId/messages', asyncHandler(createMessageController));
router.post('/messages/:messageId/reactions', asyncHandler(toggleReactionController));

export default router;
