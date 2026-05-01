import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  username: z.string().min(2, '닉네임은 2자 이상이어야 합니다.').max(20, '닉네임은 20자 이하여야 합니다.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
