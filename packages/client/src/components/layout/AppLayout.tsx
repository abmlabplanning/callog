import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="app-container">
      <main style={{ paddingBottom: 'var(--bottom-nav-height)' }}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
