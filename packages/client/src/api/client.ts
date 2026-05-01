import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshing) {
        refreshing = axios
          .post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/refresh`, {}, { withCredentials: true })
          .then((r) => {
            const { accessToken } = r.data;
            useAuthStore.getState().updateToken(accessToken);
            return accessToken;
          })
          .catch(() => {
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
            return Promise.reject(error);
          })
          .finally(() => { refreshing = null; });
      }
      try {
        const newToken = await refreshing;
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
