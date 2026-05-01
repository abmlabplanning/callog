import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLog } from '../../api/logs.api';

export default function LogCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [created, setCreated] = useState<{ inviteCode: string; id: string } | null>(null);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => createLog({ name, maxMembers }),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      setCreated({ inviteCode: data.log.inviteCode, id: data.log.id });
    },
  });

  if (created) {
    return (
      <div className="app-container" style={styles.page}>
        <div style={styles.successCard}>
          <div style={styles.successEmoji}>🎉</div>
          <h2 style={styles.successTitle}>로그 :)</h2>
          <div style={styles.codeBox}>
            <span style={styles.codeLabel}># </span>
            <span style={styles.codeValue}>{created.inviteCode}</span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 28 }}>
            친구에게 코드를 공유해서 초대하세요
          </p>
          <button className="btn-primary" style={{ marginBottom: 12 }} onClick={() => navigate(`/logs/${created.id}`)}>
            완료 →
          </button>
          <button className="btn-outline" onClick={() => {
            navigator.clipboard.writeText(created.inviteCode);
          }}>
            코드 복사하기
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
            <path d="M19 12H5" />
          </svg>
        </button>
        <h1 style={styles.title}>로그 만들기</h1>
        <button
          onClick={() => mutate()}
          disabled={isPending || !maxMembers}
          style={{
            ...styles.confirmBtn,
            background: maxMembers ? 'var(--color-primary)' : 'var(--color-border)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </header>

      <div style={styles.body}>
        <p style={styles.sectionLabel}>→ 로그 만들기</p>

        <div style={styles.field}>
          <label style={styles.fieldLabel}>로그 이름 (선택)</label>
          <input
            className="input-field"
            placeholder="로그 이름을 입력해주세요."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.fieldLabel}>인원수 선택</label>
          <div style={styles.numberGrid}>
            {[2,3,4,5,6,7,8,9,10,11,12].map((n) => (
              <button
                key={n}
                onClick={() => setMaxMembers(n)}
                style={{
                  ...styles.numberBtn,
                  background: maxMembers === n ? 'var(--color-primary)' : 'transparent',
                  color: maxMembers === n ? '#fff' : 'var(--color-text)',
                  borderColor: maxMembers === n ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>
            {(error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || '오류가 발생했습니다.'}
          </p>
        )}
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
  backBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 700 },
  confirmBtn: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  body: { padding: '28px 24px' },
  sectionLabel: { fontSize: 15, color: 'var(--color-text-secondary)', marginBottom: 24 },
  field: { marginBottom: 28 },
  fieldLabel: { display: 'block', fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' },
  numberGrid: { display: 'flex', flexWrap: 'wrap' as const, gap: 8 },
  numberBtn: {
    width: 48, height: 48, borderRadius: 12, border: '1.5px solid',
    fontSize: 15, fontWeight: 600, transition: 'all 0.15s',
  },
  successCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '60px 28px 40px', minHeight: '100vh',
  },
  successEmoji: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: 900, marginBottom: 24 },
  codeBox: {
    padding: '16px 28px', background: 'var(--color-icon-bg)',
    borderRadius: 'var(--radius-md)', marginBottom: 12, fontSize: 22,
  },
  codeLabel: { color: 'var(--color-text-secondary)' },
  codeValue: { fontWeight: 800, color: 'var(--color-primary-dark)', letterSpacing: 2 },
};
