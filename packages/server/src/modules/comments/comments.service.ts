import prisma from '../../config/database';

export const getComments = async (postId: string) => {
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, username: true, avatarUrl: true } } },
  });
};

export const createComment = async (postId: string, authorId: string, content: string) => {
  if (!content?.trim()) throw Object.assign(new Error('댓글을 입력해주세요.'), { status: 400 });
  return prisma.comment.create({
    data: { postId, authorId, content: content.trim() },
    include: { author: { select: { id: true, username: true, avatarUrl: true } } },
  });
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw Object.assign(new Error('댓글을 찾을 수 없습니다.'), { status: 404 });
  if (comment.authorId !== userId) throw Object.assign(new Error('삭제 권한이 없습니다.'), { status: 403 });
  await prisma.comment.delete({ where: { id: commentId } });
};
