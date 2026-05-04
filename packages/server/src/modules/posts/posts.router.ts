import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { upload } from '../../config/multer';
import {
  signUploadController,
  getLogPostsController,
  createLogPostController,
  getVlogPostsController,
  createVlogPostController,
  deletePostController,
} from './posts.controller';

const router = Router();

router.use(authMiddleware);

router.post('/sign-upload', asyncHandler(signUploadController));
router.get('/logs/:logId/posts', asyncHandler(getLogPostsController));
router.post('/logs/:logId/posts', upload.single('file'), asyncHandler(createLogPostController));
router.get('/vlog', asyncHandler(getVlogPostsController));
router.post('/vlog', upload.single('file'), asyncHandler(createVlogPostController));
router.delete('/:postId', asyncHandler(deletePostController));

export default router;
