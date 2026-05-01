import prisma from '../../config/database';
import { generateInviteCode } from '../../utils/inviteCode';
import { CreateLogInput, JoinLogInput } from './logs.schema';

export const getMyLogs = async (userId: string) => {
  const memberships = await prisma.logMember.findMany({
    where: { userId },
    include: {
      log: {
        include: {
          _count: { select: { members: true, posts: true } },
          members: {
            include: { user: { select: { id: true, username: true, avatarUrl: true } } },
            take: 8,
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
  return memberships.map((m: typeof memberships[number]) => ({ ...m.log, role: m.role }));
};

export const createLog = async (userId: string, input: CreateLogInput) => {
  let inviteCode = generateInviteCode();
  let attempt = 0;
  while (attempt < 5) {
    const existing = await prisma.log.findUnique({ where: { inviteCode } });
    if (!existing) break;
    inviteCode = generateInviteCode();
    attempt++;
  }

  const log = await prisma.log.create({
    data: {
      name: input.name,
      inviteCode,
      maxMembers: input.maxMembers,
      createdById: userId,
      members: { create: { userId, role: 'OWNER' } },
    },
    include: { _count: { select: { members: true } } },
  });
  return log;
};

export const getLogById = async (logId: string, userId: string) => {
  const member = await prisma.logMember.findUnique({ where: { logId_userId: { logId, userId } } });
  if (!member) throw Object.assign(new Error('로그에 접근할 권한이 없습니다.'), { status: 403 });

  return prisma.log.findUnique({
    where: { id: logId },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { members: true, posts: true } },
    },
  });
};

export const joinLog = async (userId: string, input: JoinLogInput) => {
  const log = await prisma.log.findUnique({
    where: { inviteCode: input.inviteCode },
    include: { _count: { select: { members: true } } },
  });
  if (!log) throw Object.assign(new Error('존재하지 않는 초대 코드입니다.'), { status: 404 });

  const existing = await prisma.logMember.findUnique({
    where: { logId_userId: { logId: log.id, userId } },
  });
  if (existing) throw Object.assign(new Error('이미 참여 중인 로그입니다.'), { status: 409 });

  if (log._count.members >= log.maxMembers) {
    throw Object.assign(new Error('정원이 가득 찼습니다.'), { status: 400 });
  }

  await prisma.logMember.create({ data: { logId: log.id, userId } });
  return { log: { id: log.id, name: log.name, inviteCode: log.inviteCode, memberCount: log._count.members + 1 } };
};

export const leaveLog = async (logId: string, userId: string) => {
  const member = await prisma.logMember.findUnique({ where: { logId_userId: { logId, userId } } });
  if (!member) throw Object.assign(new Error('참여 중인 로그가 아닙니다.'), { status: 404 });

  await prisma.logMember.delete({ where: { logId_userId: { logId, userId } } });
};
