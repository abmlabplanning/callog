import apiClient from './client';
import type { Post, Comment } from '../types';

const signUpload = (mimetype: string) =>
  apiClient.post<{ signedUrl: string; path: string }>('/posts/sign-upload', { mimetype });

async function uploadViaSignedUrl(file: File): Promise<{ path: string; mediaType: 'VIDEO' | 'IMAGE' }> {
  const { data } = await signUpload(file.type);
  const res = await fetch(data.signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) throw new Error(`스토리지 업로드 실패 (${res.status})`);
  return {
    path: data.path,
    mediaType: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
  };
}

export const getLogPosts = (logId: string, cursor?: string, memberId?: string, limit?: number, date?: string) =>
  apiClient.get<{ posts: Post[]; nextCursor: string | null }>(`/posts/logs/${logId}/posts`, {
    params: { cursor, memberId, limit, date },
  });

export const createLogPost = async (logId: string, file: File, caption?: string) => {
  const { path, mediaType } = await uploadViaSignedUrl(file);
  return apiClient.post<{ post: Post }>(`/posts/logs/${logId}/posts`, { path, mediaType, caption });
};

export const getVlogPosts = (cursor?: string) =>
  apiClient.get<{ posts: Post[]; nextCursor: string | null }>('/posts/vlog', { params: { cursor } });

export const createVlogPost = async (file: File, caption?: string) => {
  const { path, mediaType } = await uploadViaSignedUrl(file);
  return apiClient.post<{ post: Post }>('/posts/vlog', { path, mediaType, caption });
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
