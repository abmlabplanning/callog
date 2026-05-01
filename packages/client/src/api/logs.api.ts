import apiClient from './client';
import { Log } from '../types';

export const getMyLogs = () => apiClient.get<{ logs: Log[] }>('/logs');

export const createLog = (data: { name: string; maxMembers: number }) =>
  apiClient.post<{ log: Log }>('/logs', data);

export const getLogById = (logId: string) => apiClient.get<{ log: Log }>(`/logs/${logId}`);

export const joinLog = (inviteCode: string) =>
  apiClient.post<{ log: { id: string; name: string; inviteCode: string; memberCount: number } }>('/logs/join', { inviteCode });

export const leaveLog = (logId: string) => apiClient.delete(`/logs/${logId}/leave`);
