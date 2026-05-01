import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
} from './auth.controller';

const router = Router();

router.post('/register', asyncHandler(registerController));
router.post('/login', asyncHandler(loginController));
router.post('/refresh', asyncHandler(refreshController));
router.post('/logout', asyncHandler(logoutController));

export default router;
