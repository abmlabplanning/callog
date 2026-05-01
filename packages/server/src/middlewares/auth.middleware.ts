import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../config/jwt';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_ACCESS_SECRET) as { id: string; email: string };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: '토큰이 만료되었습니다.' } });
  }
};
