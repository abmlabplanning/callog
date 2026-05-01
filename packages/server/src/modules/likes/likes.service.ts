import prisma from '../../config/database';

export const toggleLike = async (postId: string, userId: string) => {
  const existing = await prisma.like.findUnique({ where: { postId_userId: { postId, userId } } });

  if (existing) {
    await prisma.like.delete({ where: { postId_userId: { postId, userId } } });
  } else {
    await prisma.like.create({ data: { postId, userId } });
  }

  const likeCount = await prisma.like.count({ where: { postId } });
  return { liked: !existing, likeCount };
};
