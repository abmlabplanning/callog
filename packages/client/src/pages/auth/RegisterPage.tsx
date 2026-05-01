import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await register(form);
      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={styles.page}>
      <div style={styles.header}>
        <Link to="/login" style={{ color: 'var(--color-text-secondary)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 style={styles.title}>회원가입</h2>
        <div style={{ width: 24 }} />
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>이메일</label>
          <input
            className="input-field"
            type="email"
            placeholder="이메일을 입력해주세요."
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>닉네임</label>
          <input
            className="input-field"
            type="text"
            placeholder="닉네임을 입력해주세요. (2~20자)"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            required
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>비밀번호</label>
          <input
            className="input-field"
            type="password"
            placeholder="비밀번호를 입력해주세요. (6자 이상)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button
          className="btn-primary"
          type="submit"
          disabled={loading}
          style={{ marginTop: 24 }}
        >
          {loading ? '처리 중...' : '시작하기'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '20px 24px 40px',
    minHeight: '100vh',
    background: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--color-text)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-text)',
  },
  error: {
    color: 'var(--color-error)',
    fontSize: 13,
  },
};
