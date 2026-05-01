import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { toggleLike } from './likes.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Response } from 'express';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await toggleLike(req.params.postId, req.user!.id);
  res.json(result);
}));

export default router;
