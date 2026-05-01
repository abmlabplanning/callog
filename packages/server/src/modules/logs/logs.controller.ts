import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { createLogSchema, joinLogSchema } from './logs.schema';
import * as logsService from './logs.service';

export const getMyLogsController = async (req: AuthRequest, res: Response): Promise<void> => {
  const logs = await logsService.getMyLogs(req.user!.id);
  res.json({ logs });
};

export const createLogController = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createLogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
    return;
  }

  const log = await logsService.createLog(req.user!.id, parsed.data);
  res.status(201).json({ log });
};

export const getLogByIdController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const log = await logsService.getLogById(req.params.logId, req.user!.id);
    res.json({ log });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};

export const joinLogController = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = joinLogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
    return;
  }

  try {
    const result = await logsService.joinLog(req.user!.id, parsed.data);
    res.json(result);
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};

export const leaveLogController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await logsService.leaveLog(req.params.logId, req.user!.id);
    res.json({ message: '로그에서 나왔습니다.' });
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: { code: 'ERROR', message: e.message } });
  }
};
