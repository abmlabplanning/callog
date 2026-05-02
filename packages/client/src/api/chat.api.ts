import apiClient from './client';
import type { Message } from '../types';

export const getMessages = (logId: string, cursor?: string) =>
  apiClient.get<{ messages: Message[] }>(`/logs/${logId}/messages`, { params: { cursor } });

export const createMessage = (logId: string, body: { content?: string; postId?: string; parentId?: string }) =>
  apiClient.post<{ message: Message }>(`/logs/${logId}/messages`, body);

export const toggleReaction = (messageId: string, emoji = '❤️') =>
  apiClient.post<{ reacted: boolean }>(`/messages/${messageId}/reactions`, { emoji });
