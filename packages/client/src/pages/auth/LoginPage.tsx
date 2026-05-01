import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth.api';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await login(form);
      setAuth(data.user, data.accessToken);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={styles.page}>
      {/* 로고 */}
      <div style={styles.logoSection}>
        <div style={styles.logoIcon}>
          <svg width="48" height="40" viewBox="0 0 48 40" fill="none">
            <path d="M24 4L44 20L24 36L4 20L24 4Z" fill="var(--color-primary)" opacity="0.15" />
            <path d="M24 8L40 20L24 32L8 20L24 8Z" stroke="var(--color-primary)" strokeWidth="2.5" fill="none" />
            <path d="M16 20L21 25L32 15" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={styles.logoText}>CALVAK</h1>
        <p style={styles.logoSub}>대학생 디지털 선배, <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>캘박!</span></p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          className="input-field"
          type="email"
          placeholder="ID를 입력해주세요."
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
        />
        <input
          className="input-field"
          type="password"
          placeholder="비밀번호를 입력해주세요."
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
          style={{ marginTop: 10 }}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button
          className="btn-primary"
          type="submit"
          disabled={loading}
          style={{ marginTop: 20 }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {/* 소셜 로그인 버튼 (시연용 UI) */}
      <div style={styles.social}>
        <button style={{ ...styles.socialBtn, background: '#FEE500', color: '#3A1D1D' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2C5.58 2 2 4.97 2 8.67c0 2.39 1.57 4.49 3.94 5.67L5 17l3.5-1.94C9 15.17 9.5 15.2 10 15.2c4.42 0 8-2.97 8-6.53S14.42 2 10 2z" />
          </svg>
          카카오톡으로 시작하기
        </button>
        <button style={{ ...styles.socialBtn, background: '#03C75A', color: '#fff' }}>
          <span style={{ fontWeight: 900, fontSize: 16 }}>N</span>
          네이버로 시작하기
        </button>
        <button style={{ ...styles.socialBtn, background: '#fff', color: '#444', border: '1px solid var(--color-border)' }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          구글로 시작하기
        </button>
      </div>

      {/* 회원가입 링크 */}
      <p style={styles.signupLink}>
        계정이 없으신가요?{' '}
        <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
          회원가입
        </Link>
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 28px 40px',
    minHeight: '100vh',
    background: '#fff',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    marginBottom: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 900,
    color: 'var(--color-primary-dark)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  logoSub: {
    fontSize: 15,
    color: 'var(--color-text-secondary)',
  },
  form: {
    width: '100%',
    marginBottom: 20,
  },
  error: {
    color: 'var(--color-error)',
    fontSize: 13,
    marginTop: 8,
  },
  social: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 8,
  },
  socialBtn: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: 15,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    border: 'none',
  },
  signupLink: {
    marginTop: 24,
    fontSize: 14,
    color: 'var(--color-text-secondary)',
  },
};
