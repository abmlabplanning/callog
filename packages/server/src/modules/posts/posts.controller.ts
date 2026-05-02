import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as postsService from './posts.service';

export const getLogPostsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cursor, memberId, limit, date } = req.query;
    const result = await postsService.getLogPosts(
      req.params.logId,
      req.user!.id,
      cursor as string | undefined,
      memberId as string | undefined,
      limit ? Number(limit) : 20,
      date as string | undefined
    );
    res.json(result);
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};

export const createLogPostController = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'NO_FILE', message: '파일을 업로드해주세요.' } });
    return;
  }
  try {
    const post = await postsService.createPost(req.user!.id, req.params.logId, req.file, req.body.caption);
    res.status(201).json({ post });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};

export const getVlogPostsController = async (req: AuthRequest, res: Response): Promise<void> => {
  const { cursor, limit } = req.query;
  const result = await postsService.getVlogPosts(
    req.user!.id,
    cursor as string | undefined,
    limit ? Number(limit) : 20
  );
  res.json(result);
};

export const createVlogPostController = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: { code: 'NO_FILE', message: '파일을 업로드해주세요.' } });
    return;
  }
  const post = await postsService.createPost(req.user!.id, null, req.file, req.body.caption);
  res.status(201).json({ post });
};

export const deletePostController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await postsService.deletePost(req.params.postId, req.user!.id);
    res.json({ message: '삭제되었습니다.' });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};
