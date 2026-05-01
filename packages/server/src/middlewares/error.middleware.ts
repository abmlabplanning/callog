import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message || '서버 오류가 발생했습니다.' } });
};
