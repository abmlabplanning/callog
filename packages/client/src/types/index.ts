export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
}

export interface Log {
  id: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  createdById: string;
  createdAt: string;
  role?: 'OWNER' | 'MEMBER';
  members?: LogMember[];
  _count?: { members: number; posts: number };
}

export interface LogMember {
  id: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
  user: Pick<User, 'id' | 'username' | 'avatarUrl'>;
}

export interface Post {
  id: string;
  authorId: string;
  logId: string | null;
  mediaUrl: string;
  mediaType: 'VIDEO' | 'IMAGE';
  thumbnailUrl?: string | null;
  caption?: string | null;
  takenAt: string;
  createdAt: string;
  author: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  author: Pick<User, 'id' | 'username' | 'avatarUrl'>;
}
