import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinLog } from '../../api/logs.api';

export default function LogJoinPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const { mutate, isPending, data } = useMutation({
    mutationFn: () => joinLog(code.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || '참여에 실패했습니다.');
    },
  });

  if (data) {
    return (
      <div className="app-container" style={styles.page}>
        <div style={styles.resultCard}>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 8 }}>로그에 참여했습니다!</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>{data.data.log.name}</h2>
          <button
            className="btn-primary"
            onClick={() => navigate(`/logs/${data.data.log.id}`)}
          >
            입장 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={styles.title}>로그 참여하기</h1>
        <div style={{ width: 22 }} />
      </header>

      <div style={styles.body}>
        <p style={styles.desc}>친구한테 로그 코드를 받으세요</p>
        <div style={styles.inputRow}>
          <span style={styles.hash}>#</span>
          <input
            style={styles.codeInput}
            placeholder="코드를 입력해주세요"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && code.trim() && mutate()}
          />
          <button
            style={{
              ...styles.goBtn,
              background: code.trim() ? 'var(--color-primary)' : 'var(--color-border)',
            }}
            onClick={() => mutate()}
            disabled={!code.trim() || isPending}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#fff' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', borderBottom: '1px solid var(--color-border)',
  },
  backBtn: { color: 'var(--color-text)', display: 'flex' },
  title: { fontSize: 18, fontWeight: 700 },
  body: { padding: '40px 24px' },
  desc: { fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 20 },
  inputRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    padding: '4px 4px 4px 16px', boxShadow: 'var(--shadow-card)',
  },
  hash: { fontSize: 20, fontWeight: 800, color: 'var(--color-text-secondary)' },
  codeInput: {
    flex: 1, padding: '14px 0', fontSize: 18, fontWeight: 600,
    background: 'transparent', border: 'none', outline: 'none',
    letterSpacing: 1,
  },
  goBtn: {
    width: 44, height: 44, borderRadius: 'var(--radius-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  error: { color: 'var(--color-error)', fontSize: 13, marginTop: 10 },
  resultCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '80px 28px', textAlign: 'center',
  },
};
