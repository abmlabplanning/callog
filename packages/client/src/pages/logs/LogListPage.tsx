import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyLogs } from '../../api/logs.api';
import type { Log } from '../../types';
import Avatar from '../../components/common/Avatar';

export default function LogListPage() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => getMyLogs().then((r) => r.data.logs),
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* 헤더 */}
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={styles.title}>로그</h1>
        <button onClick={() => setShowMenu((v) => !v)} style={styles.addBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      {/* + 드롭다운 메뉴 */}
      {showMenu && (
        <>
          <div style={styles.menuOverlay} onClick={() => setShowMenu(false)} />
          <div style={styles.menu}>
            <button style={styles.menuItem} onClick={() => { setShowMenu(false); navigate('/logs/create'); }}>
              로그 만들기
            </button>
            <button style={styles.menuItem} onClick={() => { setShowMenu(false); navigate('/logs/join'); }}>
              입장
            </button>
          </div>
        </>
      )}

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* vlog 카드 */}
        <button onClick={() => navigate('/vlog')} style={styles.vlogCard}>
          <div style={styles.vlogIcon}>⭐</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>vlog</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              나만의 공간, 매일 오전 4시에 하루 시작
            </p>
          </div>
        </button>

        {/* 그룹 로그 목록 */}
        {isLoading && (
          <div style={styles.loadingBox}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>불러오는 중...</p>
          </div>
        )}
        {data?.map((log) => <LogCard key={log.id} log={log} onClick={() => navigate(`/logs/${log.id}`)} />)}
        {!isLoading && (!data || data.length === 0) && (
          <div style={styles.emptyBox}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center' }}>
              아직 참여 중인 로그가 없어요<br />
              <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>+ 버튼</span>을 눌러 시작해보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LogCard({ log, onClick }: { log: Log; onClick: () => void }) {
  const members = log.members?.map((m) => m.user) ?? [];
  const memberCount = log._count?.members ?? members.length;

  return (
    <button onClick={onClick} style={styles.logCard}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{log.name}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          멤버 {memberCount}/{log.maxMembers}
        </p>
      </div>
      <div style={styles.avatarRow}>
        {members.slice(0, 4).map((m) => (
          <div key={m.id} style={{ marginLeft: -6 }}>
            <Avatar username={m.username} avatarUrl={m.avatarUrl} size={28} />
          </div>
        ))}
        {memberCount > 4 && (
          <div style={{ ...styles.moreAvatars, marginLeft: -6 }}>+{memberCount - 4}</div>
        )}
      </div>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  backBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 700 },
  addBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center' },
  menuOverlay: { position: 'fixed', inset: 0, zIndex: 30 },
  menu: {
    position: 'absolute',
    top: 58,
    right: 16,
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-elevated)',
    zIndex: 40,
    overflow: 'hidden',
    minWidth: 140,
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border)',
  },
  vlogCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 18px',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
    width: '100%',
    textAlign: 'left',
  },
  vlogIcon: {
    width: 48,
    height: 48,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-icon-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },
  logCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 18px',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-card)',
    width: '100%',
    textAlign: 'left',
  },
  avatarRow: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 6,
  },
  moreAvatars: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  },
  loadingBox: {
    padding: 40,
    display: 'flex',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
  },
};
