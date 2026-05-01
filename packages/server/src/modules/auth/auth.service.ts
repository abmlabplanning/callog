import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_MS,
} from '../../config/jwt';
import { RegisterInput, LoginInput } from './auth.schema';

const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign({ id: userId, email }, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

export const register = async (input: RegisterInput) => {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    if (existing.email === input.email) throw new Error('이미 사용 중인 이메일입니다.');
    throw new Error('이미 사용 중인 닉네임입니다.');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email: input.email, username: input.username, passwordHash },
    select: { id: true, email: true, username: true, avatarUrl: true },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.email);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + JWT_REFRESH_EXPIRES_MS),
    },
  });

  return { user, accessToken, refreshToken };
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');

  const { accessToken, refreshToken } = generateTokens(user.id, user.email);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + JWT_REFRESH_EXPIRES_MS),
    },
  });

  return {
    user: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl },
    accessToken,
    refreshToken,
  };
};

export const refresh = async (token: string) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new Error('유효하지 않은 토큰입니다.');
  }

  try {
    jwt.verify(token, JWT_REFRESH_SECRET);
  } catch {
    throw new Error('유효하지 않은 토큰입니다.');
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(stored.user.id, stored.user.email);
  await prisma.refreshToken.delete({ where: { token } });
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: stored.user.id,
      expiresAt: new Date(Date.now() + JWT_REFRESH_EXPIRES_MS),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};
