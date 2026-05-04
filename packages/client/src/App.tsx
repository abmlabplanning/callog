import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/home/HomePage';
import LogListPage from './pages/logs/LogListPage';
import LogCreatePage from './pages/logs/LogCreatePage';
import LogJoinPage from './pages/logs/LogJoinPage';
import LogDetailPage from './pages/logs/LogDetailPage';
import LogChatPage from './pages/logs/LogChatPage';
import VlogPage from './pages/vlog/VlogPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<Placeholder title="이벤트" />} />
              <Route path="/calendar" element={<Placeholder title="캘린더" />} />
              <Route path="/ai" element={<Placeholder title="캘박 AI" />} />
              <Route path="/logs/:logId" element={<LogDetailPage />} />
              <Route path="/logs/:logId/chat" element={<LogChatPage />} />
            </Route>

            {/* 로그 목록/생성/참여 (풀스크린) */}
            <Route path="/logs" element={<LogListPage />} />
            <Route path="/logs/create" element={<LogCreatePage />} />
            <Route path="/logs/join" element={<LogJoinPage />} />
            <Route path="/vlog" element={<VlogPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 16 }}>{title} (준비 중)</p>
    </div>
  );
}
