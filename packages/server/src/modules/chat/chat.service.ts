import prisma from '../../config/database';

const messageInclude = {
  author: { select: { id: true, username: true, avatarUrl: true } },
  post: {
    select: {
      id: true,
      mediaUrl: true,
      mediaType: true,
      thumbnailUrl: true,
      caption: true,
      takenAt: true,
      author: { select: { id: true, username: true, avatarUrl: true } },
    },
  },
  reactions: {
    select: { id: true, userId: true, emoji: true },
  },
  parent: {
    select: {
      id: true,
      content: true,
      author: { select: { id: true, username: true } },
    },
  },
  _count: { select: { replies: true } },
} as const;

const formatMessage = (m: Awaited<ReturnType<typeof prisma.message.findMany>>[number] & {
  reactions: { id: string; userId: string; emoji: string }[];
  _count: { replies: number };
}, userId: string) => {
  const reactionMap: Record<string, { count: number; isReacted: boolean }> = {};
  m.reactions.forEach((r) => {
    if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { count: 0, isReacted: false };
    reactionMap[r.emoji].count += 1;
    if (r.userId === userId) reactionMap[r.emoji].isReacted = true;
  });

  return {
    ...m,
    reactions: Object.entries(reactionMap).map(([emoji, v]) => ({ emoji, ...v })),
    replyCount: m._count.replies,
    _count: undefined,
  };
};

export const getMessages = async (logId: string, userId: string, cursor?: string) => {
  const member = await prisma.logMember.findUnique({ where: { logId_userId: { logId, userId } } });
  if (!member) throw Object.assign(new Error('접근 권한이 없습니다.'), { status: 403 });

  let cursorDate: Date | undefined;
  if (cursor) {
    const cursorMsg = await prisma.message.findUnique({ where: { id: cursor }, select: { createdAt: true } });
    cursorDate = cursorMsg?.createdAt;
  }

  const messages = await prisma.message.findMany({
    where: {
      logId,
      parentId: null, // 최상위 메시지만 (답글 제외)
      ...(cursorDate && { createdAt: { lt: cursorDate } }),
    },
    orderBy: { createdAt: 'asc' },
    take: cursor ? 30 : 50,
    include: messageInclude,
  });

  return messages.map((m) => formatMessage(m as typeof m & { reactions: { id: string; userId: string; emoji: string }[]; _count: { replies: number } }, userId));
};

export const createMessage = async (
  logId: string,
  authorId: string,
  content?: string,
  postId?: string,
  parentId?: string
) => {
  if (!content && !postId) {
    throw Object.assign(new Error('내용 또는 쇼츠가 필요합니다.'), { status: 400 });
  }

  const member = await prisma.logMember.findUnique({ where: { logId_userId: { logId, userId: authorId } } });
  if (!member) throw Object.assign(new Error('접근 권한이 없습니다.'), { status: 403 });

  const message = await prisma.message.create({
    data: { logId, authorId, content, postId, parentId },
    include: messageInclude,
  });

  return formatMessage(message as typeof message & { reactions: { id: string; userId: string; emoji: string }[]; _count: { replies: number } }, authorId);
};

export const toggleReaction = async (messageId: string, userId: string, emoji: string) => {
  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
    return { reacted: false };
  } else {
    await prisma.messageReaction.create({ data: { messageId, userId, emoji } });
    return { reacted: true };
  }
};
