import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import * as chatService from './chat.service';

export const getMessagesController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cursor } = req.query;
    const messages = await chatService.getMessages(
      req.params.logId,
      req.user!.id,
      cursor as string | undefined
    );
    res.json({ messages });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};

export const createMessageController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, postId, parentId } = req.body;
    const message = await chatService.createMessage(
      req.params.logId,
      req.user!.id,
      content,
      postId,
      parentId
    );
    res.status(201).json({ message });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};

export const toggleReactionController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { emoji = '❤️' } = req.body;
    const result = await chatService.toggleReaction(req.params.messageId, req.user!.id, emoji);
    res.json(result);
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};
