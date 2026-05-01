import { z } from 'zod';

export const createLogSchema = z.object({
  name: z.string().min(1, '로그 이름을 입력해주세요.').max(50),
  maxMembers: z.number().int().min(2).max(12),
});

export const joinLogSchema = z.object({
  inviteCode: z.string().min(1, '초대 코드를 입력해주세요.'),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;
export type JoinLogInput = z.infer<typeof joinLogSchema>;
