import { Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import * as authService from './auth.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const registerController = async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION', message: parsed.error.errors[0].message } });
    return;
  }

  try {
    const { user, accessToken, refreshToken } = await authService.register(parsed.data);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    res.status(409).json({ error: { code: 'CONFLICT', message: (err as Error).message } });
  }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION', message: '이메일과 비밀번호를 입력해주세요.' } });
    return;
  }

  try {
    const { user, accessToken, refreshToken } = await authService.login(parsed.data);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ user, accessToken });
  } catch (err) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: (err as Error).message } });
  }
};

export const refreshController = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: { code: 'NO_TOKEN', message: '토큰이 없습니다.' } });
    return;
  }

  try {
    const { accessToken, refreshToken } = await authService.refresh(token);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: (err as Error).message } });
  }
};

export const logoutController = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await authService.logout(token);
  }
  res.clearCookie('refreshToken');
  res.json({ message: '로그아웃 되었습니다.' });
};
