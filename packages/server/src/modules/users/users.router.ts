import { Router } from 'express';
import { Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import prisma from '../../config/database';

const router = Router();

router.use(authMiddleware);

router.get('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, username: true, avatarUrl: true, createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: '유저를 찾을 수 없습니다.' } });
    return;
  }
  res.json({ user });
}));

router.patch('/me', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { ...(username && { username }), ...(avatarUrl !== undefined && { avatarUrl }) },
    select: { id: true, email: true, username: true, avatarUrl: true },
  });
  res.json({ user });
}));

export default router;
