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

export interface MessageReactionSummary {
  emoji: string;
  count: number;
  isReacted: boolean;
}

export interface Message {
  id: string;
  logId: string;
  authorId: string;
  content?: string | null;
  postId?: string | null;
  parentId?: string | null;
  createdAt: string;
  author: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  post?: Pick<Post, 'id' | 'mediaUrl' | 'mediaType' | 'thumbnailUrl' | 'caption' | 'takenAt'> & {
    author: Pick<User, 'id' | 'username' | 'avatarUrl'>;
  } | null;
  parent?: { id: string; content?: string | null; author: Pick<User, 'id' | 'username'> } | null;
  reactions: MessageReactionSummary[];
  replyCount: number;
}
