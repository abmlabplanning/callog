import apiClient from './client';
import type { Post, Comment } from '../types';

export const getLogPosts = (logId: string, cursor?: string, memberId?: string, limit?: number, date?: string) =>
  apiClient.get<{ posts: Post[]; nextCursor: string | null }>(`/posts/logs/${logId}/posts`, {
    params: { cursor, memberId, limit, date },
  });

export const createLogPost = (logId: string, file: File, caption?: string) => {
  const form = new FormData();
  form.append('file', file);
  if (caption) form.append('caption', caption);
  return apiClient.post<{ post: Post }>(`/posts/logs/${logId}/posts`, form);
};

export const getVlogPosts = (cursor?: string) =>
  apiClient.get<{ posts: Post[]; nextCursor: string | null }>('/posts/vlog', { params: { cursor } });

export const createVlogPost = (file: File, caption?: string) => {
  const form = new FormData();
  form.append('file', file);
  if (caption) form.append('caption', caption);
  return apiClient.post<{ post: Post }>('/posts/vlog', form);
};

export const deletePost = (postId: string) => apiClient.delete(`/posts/${postId}`);

export const toggleLike = (postId: string) =>
  apiClient.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/likes`);

export const getComments = (postId: string) =>
  apiClient.get<{ comments: Comment[] }>(`/posts/${postId}/comments`);

export const createComment = (postId: string, content: string) =>
  apiClient.post<{ comment: Comment }>(`/posts/${postId}/comments`, { content });

export const deleteComment = (postId: string, commentId: string) =>
  apiClient.delete(`/posts/${postId}/comments/${commentId}`);
