import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLogPosts } from '../../api/posts.api';
import type { Post } from '../../types';

interface Props {
  logId: string;
  logName: string;
  onClose: () => void;
}

type Layout = '2x2' | '3x3' | 'featured' | 'strip';

const LAYOUTS: { id: Layout; label: string; desc: string }[] = [
  { id: '2x2', label: '2×2 그리드', desc: '4개 균등 배치' },
  { id: '3x3', label: '3×3 그리드', desc: '9개 균등 배치' },
  { id: 'featured', label: '피처드', desc: '1개 크게 + 우측 4개' },
  { id: 'strip', label: '가로 스트립', desc: '최대 6개 수평' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function ShareExportModal({ logId, logName, onClose }: Props) {
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [layout, setLayout] = useState<Layout>('2x2');
  const [step, setStep] = useState<'config' | 'preview'>('config');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ['export-posts', logId, startDate, endDate],
    queryFn: async () => {
      // startDate의 포스트와 endDate 포스트를 모두 가져오기 (날짜별 복수 조회)
      if (startDate === endDate) {
        return getLogPosts(logId, undefined, undefined, 100, startDate).then((r) => r.data.posts);
      }
      const results = await Promise.all([
        getLogPosts(logId, undefined, undefined, 100, startDate).then((r) => r.data.posts),
        getLogPosts(logId, undefined, undefined, 100, endDate).then((r) => r.data.posts),
      ]);
      return [...results[0], ...results[1]];
    },
    enabled: step === 'preview',
  });

  const renderCanvas = useCallback(async (posts: Post[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const SIZE = 800;
    canvas.width = SIZE;
    canvas.height = SIZE;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // 로고 텍스트
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(logName, 20, 28);

    const PAD = 8;
    const TOP = 44;
    const AVAIL = SIZE - PAD * 2;
    const AVAIL_H = SIZE - TOP - PAD;

    const loadImg = (url: string): Promise<HTMLImageElement> =>
      new Promise((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => res(img);
        img.onerror = () => res(img);
        img.src = url;
      });

    const thumbPosts = posts.filter((p) => p.thumbnailUrl || p.mediaType === 'IMAGE');

    const drawSlot = async (p: Post | undefined, x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      if (!p) return;
      const url = p.thumbnailUrl ?? (p.mediaType === 'IMAGE' ? p.mediaUrl : null);
      if (url) {
        try {
          const img = await loadImg(url);
          if (img.complete && img.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 8);
            ctx.clip();
            // cover
            const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
            const sw = img.naturalWidth * scale;
            const sh = img.naturalHeight * scale;
            ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
            ctx.restore();
          }
        } catch { /* skip */ }
      }
    };

    if (layout === '2x2') {
      const cellW = (AVAIL - PAD) / 2;
      const cellH = (AVAIL_H - PAD) / 2;
      const slots = thumbPosts.slice(0, 4);
      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        await drawSlot(slots[i], PAD + col * (cellW + PAD), TOP + row * (cellH + PAD), cellW, cellH);
      }
    } else if (layout === '3x3') {
      const cellW = (AVAIL - PAD * 2) / 3;
      const cellH = (AVAIL_H - PAD * 2) / 3;
      const slots = thumbPosts.slice(0, 9);
      for (let i = 0; i < 9; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        await drawSlot(slots[i], PAD + col * (cellW + PAD), TOP + row * (cellH + PAD), cellW, cellH);
      }
    } else if (layout === 'featured') {
      const mainW = AVAIL * 0.6 - PAD / 2;
      const sideW = AVAIL * 0.4 - PAD / 2;
      const sideH = (AVAIL_H - PAD * 3) / 4;
      const slots = thumbPosts.slice(0, 5);
      await drawSlot(slots[0], PAD, TOP, mainW, AVAIL_H);
      for (let i = 0; i < 4; i++) {
        await drawSlot(slots[i + 1], PAD + mainW + PAD, TOP + i * (sideH + PAD), sideW, sideH);
      }
    } else {
      // strip
      const n = Math.min(thumbPosts.length, 6);
      const cellW = n > 0 ? (AVAIL - PAD * (n - 1)) / n : AVAIL;
      const slots = thumbPosts.slice(0, 6);
      for (let i = 0; i < Math.max(n, 1); i++) {
        await drawSlot(slots[i], PAD + i * (cellW + PAD), TOP + AVAIL_H * 0.1, cellW, AVAIL_H * 0.8);
      }
    }
  }, [layout, logName]);

  useEffect(() => {
    if (step === 'preview' && data) {
      renderCanvas(data);
    }
  }, [step, data, renderCanvas]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `callog-${logName}-${startDate}.png`;
    a.click();
  };

  return (
    <>
      <div style={s.backdrop} onClick={onClose} />
      <div style={s.modal}>
        <div style={s.header}>
          <h3 style={s.title}>공유 내보내기</h3>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {step === 'config' ? (
          <div style={s.body}>
            {/* 날짜 범위 */}
            <div style={s.section}>
              <p style={s.label}>날짜 선택</p>
              <div style={s.dateRow}>
                <div style={s.dateField}>
                  <p style={s.fieldLabel}>시작</p>
                  <input type="date" style={s.dateInput} value={startDate}
                    max={todayStr()}
                    onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <span style={s.dateSep}>~</span>
                <div style={s.dateField}>
                  <p style={s.fieldLabel}>종료</p>
                  <input type="date" style={s.dateInput} value={endDate}
                    min={startDate} max={todayStr()}
                    onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            {/* 레이아웃 */}
            <div style={s.section}>
              <p style={s.label}>레이아웃</p>
              <div style={s.layoutGrid}>
                {LAYOUTS.map((l) => (
                  <button key={l.id} onClick={() => setLayout(l.id)}
                    style={{ ...s.layoutCard, ...(layout === l.id ? s.layoutCardActive : {}) }}>
                    <LayoutPreviewIcon id={l.id} active={layout === l.id} />
                    <p style={s.layoutLabel}>{l.label}</p>
                    <p style={s.layoutDesc}>{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button style={s.primaryBtn} onClick={() => setStep('preview')}>
              미리보기 생성
            </button>
          </div>
        ) : (
          <div style={s.body}>
            {isFetching ? (
              <div style={s.loadingBox}>
                <p style={{ color: 'var(--color-text-secondary)' }}>이미지 불러오는 중...</p>
              </div>
            ) : (
              <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 8, background: '#111' }} />
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button style={s.secondaryBtn} onClick={() => setStep('config')}>← 수정</button>
              <button style={{ ...s.primaryBtn, flex: 1 }} onClick={handleDownload}>
                PNG 저장
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function LayoutPreviewIcon({ id, active }: { id: Layout; active: boolean }) {
  const color = active ? 'var(--color-primary)' : 'var(--color-text-secondary)';
  const bg = active ? 'rgba(201,74,43,0.12)' : 'var(--color-bg)';
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ background: bg, borderRadius: 6, padding: 4 }}>
      {id === '2x2' && (
        <>
          <rect x="4" y="4" width="18" height="18" rx="2" fill={color} />
          <rect x="26" y="4" width="18" height="18" rx="2" fill={color} />
          <rect x="4" y="26" width="18" height="18" rx="2" fill={color} />
          <rect x="26" y="26" width="18" height="18" rx="2" fill={color} />
        </>
      )}
      {id === '3x3' && (
        <>
          {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
            <rect key={`${r}${c}`} x={4 + c * 14} y={4 + r * 14} width="12" height="12" rx="1" fill={color} />
          )))}
        </>
      )}
      {id === 'featured' && (
        <>
          <rect x="4" y="4" width="24" height="40" rx="2" fill={color} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x="32" y={4 + i * 10} width="12" height="8" rx="1" fill={color} opacity="0.7" />
          ))}
        </>
      )}
      {id === 'strip' && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={4 + i * 11} y="8" width="9" height="32" rx="2" fill={color} />
          ))}
        </>
      )}
    </svg>
  );
}

const s: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 80 },
  modal: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'var(--color-surface)', borderRadius: '20px 20px 0 0', zIndex: 90, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 },
  title: { fontSize: 17, fontWeight: 700 },
  closeBtn: { fontSize: 18, color: 'var(--color-text-secondary)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, overflowY: 'auto', padding: '16px' },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--color-text)' },
  dateRow: { display: 'flex', alignItems: 'center', gap: 10 },
  dateField: { flex: 1 },
  fieldLabel: { fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 },
  dateInput: { width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, color: 'var(--color-text)', background: 'var(--color-bg)', boxSizing: 'border-box' },
  dateSep: { color: 'var(--color-text-secondary)', fontSize: 16, marginTop: 16 },
  layoutGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  layoutCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 8px', border: '1.5px solid var(--color-border)', borderRadius: 10, background: 'var(--color-surface)', cursor: 'pointer' },
  layoutCardActive: { borderColor: 'var(--color-primary)', background: 'rgba(201,74,43,0.06)' },
  layoutLabel: { fontSize: 12, fontWeight: 700, color: 'var(--color-text)' },
  layoutDesc: { fontSize: 10, color: 'var(--color-text-secondary)' },
  primaryBtn: { width: '100%', height: 50, borderRadius: 25, background: 'var(--color-primary)', color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 4 },
  secondaryBtn: { height: 50, borderRadius: 25, border: '1.5px solid var(--color-border)', color: 'var(--color-text)', fontSize: 14, fontWeight: 600, padding: '0 20px' },
  loadingBox: { height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
