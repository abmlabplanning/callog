import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getMyLogsController,
  createLogController,
  getLogByIdController,
  joinLogController,
  leaveLogController,
} from './logs.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(getMyLogsController));
router.post('/', asyncHandler(createLogController));
router.get('/:logId', asyncHandler(getLogByIdController));
router.post('/join', asyncHandler(joinLogController));
router.delete('/:logId/leave', asyncHandler(leaveLogController));

export default router;
