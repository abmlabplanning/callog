import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { label: '대외활동', emoji: '👥', path: '/placeholder' },
  { label: '공모전', emoji: '🏆', path: '/placeholder' },
  { label: '신입·인턴', emoji: '📋', path: '/placeholder' },
  { label: '전시·팝업', emoji: '🎁', path: '/placeholder' },
  { label: '시간표', emoji: '🗓', path: '/placeholder' },
  { label: '학사일정', emoji: '🏛', path: '/placeholder' },
  { label: '대학축제', emoji: '🎆', path: '/placeholder', highlight: false },
  { label: '로그', emoji: '🎞', path: '/logs', highlight: true },
];

export default function CategoryGrid() {
  const navigate = useNavigate();

  return (
    <div style={styles.grid}>
      {CATEGORIES.map(({ label, emoji, path, highlight }) => (
        <button key={label} onClick={() => navigate(path)} style={styles.item}>
          <div style={{
            ...styles.iconBox,
            background: highlight ? 'var(--color-primary)' : 'var(--color-icon-bg)',
          }}>
            <span style={{ fontSize: 26 }}>{emoji}</span>
          </div>
          <span style={{
            ...styles.label,
            color: highlight ? 'var(--color-primary)' : 'var(--color-text)',
            fontWeight: highlight ? 700 : 500,
          }}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 4,
    padding: '16px 12px',
    background: 'var(--color-surface)',
    margin: '8px 0',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '12px 4px',
    borderRadius: 'var(--radius-md)',
    transition: 'background 0.15s',
    cursor: 'pointer',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
};
