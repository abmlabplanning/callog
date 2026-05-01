import prisma from '../../config/database';
import { uploadToStorage } from '../../config/supabase';

const VLOG_RESET_HOUR = 4;

const getVlogStartTime = () => {
  const now = new Date();
  const reset = new Date(now);
  reset.setHours(VLOG_RESET_HOUR, 0, 0, 0);
  if (now < reset) reset.setDate(reset.getDate() - 1);
  return reset;
};

export const getLogPosts = async (
  logId: string,
  userId: string,
  cursor?: string,
  memberId?: string,
  limit = 20
) => {
  const member = await prisma.logMember.findUnique({ where: { logId_userId: { logId, userId } } });
  if (!member) throw Object.assign(new Error('접근 권한이 없습니다.'), { status: 403 });

  let cursorDate: Date | undefined;
  if (cursor) {
    const cursorPost = await prisma.post.findUnique({ where: { id: cursor }, select: { takenAt: true } });
    cursorDate = cursorPost?.takenAt;
  }

  const posts = await prisma.post.findMany({
    where: {
      logId,
      ...(memberId && { authorId: memberId }),
      ...(cursorDate && { takenAt: { lt: cursorDate } }),
    },
    orderBy: { takenAt: 'desc' },
    take: limit + 1,
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId }, select: { id: true } },
    },
  });

  const hasNext = posts.length > limit;
  const items = posts.slice(0, limit).map((p: typeof posts[number]) => ({
    ...p,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    isLiked: p.likes.length > 0,
    likes: undefined,
    _count: undefined,
  }));

  return { posts: items, nextCursor: hasNext ? items[items.length - 1].id : null };
};

export const createPost = async (
  authorId: string,
  logId: string | null,
  file: Express.Multer.File,
  caption?: string
) => {
  const mediaType = file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
  const mediaUrl = await uploadToStorage(file.buffer, file.mimetype, file.originalname);

  return prisma.post.create({
    data: { authorId, logId, mediaUrl, mediaType, caption },
    include: { author: { select: { id: true, username: true, avatarUrl: true } } },
  });
};

export const getVlogPosts = async (userId: string, cursor?: string, limit = 20) => {
  const since = getVlogStartTime();

  let cursorDate: Date | undefined;
  if (cursor) {
    const cursorPost = await prisma.post.findUnique({ where: { id: cursor }, select: { takenAt: true } });
    cursorDate = cursorPost?.takenAt;
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: userId,
      logId: null,
      takenAt: { gte: since, ...(cursorDate && { lt: cursorDate }) },
    },
    orderBy: { takenAt: 'desc' },
    take: limit + 1,
    include: {
      _count: { select: { likes: true, comments: true } },
      likes: { where: { userId }, select: { id: true } },
    },
  });

  const hasNext = posts.length > limit;
  const items = posts.slice(0, limit).map((p: typeof posts[number]) => ({
    ...p,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    isLiked: p.likes.length > 0,
    likes: undefined,
    _count: undefined,
  }));

  return { posts: items, nextCursor: hasNext ? items[items.length - 1].id : null };
};

export const deletePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error('포스트를 찾을 수 없습니다.'), { status: 404 });
  if (post.authorId !== userId) throw Object.assign(new Error('삭제 권한이 없습니다.'), { status: 403 });
  await prisma.post.delete({ where: { id: postId } });
};
