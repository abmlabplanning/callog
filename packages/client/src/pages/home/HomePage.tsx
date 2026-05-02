import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import BannerSlider from '../../components/home/BannerSlider';
import CategoryGrid from '../../components/home/CategoryGrid';
import Avatar from '../../components/common/Avatar';
import { logout } from '../../api/auth.api';

export default function HomePage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout().catch(() => {});
    clearAuth();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* 헤더 */}
      <header style={styles.header}>
        <h1 style={styles.logo}>캘박</h1>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span style={styles.notiBadge} />
          </button>
          <button style={styles.iconBtn} onClick={handleLogout}>
            <Avatar username={user?.username} avatarUrl={user?.avatarUrl} size={32} />
          </button>
        </div>
      </header>

      {/* 배너 슬라이더 */}
      <BannerSlider />

      {/* 카테고리 그리드 */}
      <CategoryGrid />

      {/* "지금 이기이는 이저" 섹션 */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>지금 이기이는 이저</h2>
          <button style={styles.sectionMore}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        <div style={styles.placeholder}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>이벤트 및 정보가 표시됩니다</p>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: 900,
    color: 'var(--color-primary-dark)',
    letterSpacing: -0.5,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    position: 'relative',
    padding: 4,
    color: 'var(--color-text)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notiBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--color-primary)',
    border: '2px solid #fff',
  },
  section: {
    background: 'var(--color-surface)',
    marginTop: 8,
    padding: '16px 16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  sectionMore: {
    color: 'var(--color-text-secondary)',
  },
  placeholder: {
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)',
  },
};
