import { Router } from 'express';
import { Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import * as commentsService from './comments.service';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const comments = await commentsService.getComments(req.params.postId);
  res.json({ comments });
}));

router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const comment = await commentsService.createComment(req.params.postId, req.user!.id, req.body.content);
    res.status(201).json({ comment });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
}));

router.delete('/:commentId', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    await commentsService.deleteComment(req.params.commentId, req.user!.id);
    res.json({ message: '삭제되었습니다.' });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
}));

export default router;
