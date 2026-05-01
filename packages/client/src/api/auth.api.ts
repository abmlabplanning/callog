import apiClient from './client';
import type { User } from '../types';

export const register = (data: { email: string; username: string; password: string }) =>
  apiClient.post<{ user: User; accessToken: string }>('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  apiClient.post<{ user: User; accessToken: string }>('/auth/login', data);

export const logout = () => apiClient.post('/auth/logout');

export const getMe = () => apiClient.get<{ user: User }>('/users/me');
