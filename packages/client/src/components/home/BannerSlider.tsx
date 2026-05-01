import { useState } from 'react';

const BANNERS = [
  { id: 1, tag: '대외활동', dday: 'D-29', subtitle: '함께하는 캠퍼스 라이프', title: 'AdBanner', bg: 'linear-gradient(135deg, #f8d7c4 0%, #f0a080 100%)' },
  { id: 2, tag: '공모전', dday: 'D-7', subtitle: '당신의 아이디어를 펼쳐보세요', title: '아이디어 공모전', bg: 'linear-gradient(135deg, #fce4d6 0%, #e8905a 100%)' },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);

  return (
    <div style={styles.wrapper}>
      <div
        style={{ ...styles.banner, background: BANNERS[current].bg }}
        onClick={() => setCurrent((c) => (c + 1) % BANNERS.length)}
      >
        <div style={styles.flowerDecor}>
          {[...Array(6)].map((_, i) => (
            <span key={i} style={{ ...styles.flower, fontSize: 28 + (i % 2) * 8, opacity: 0.6 + (i % 3) * 0.1 }}>🌸</span>
          ))}
        </div>
        <div style={styles.overlay}>
          <div style={styles.tags}>
            <span style={styles.tag}>{BANNERS[current].tag}</span>
            <span style={styles.tag}>{BANNERS[current].dday}</span>
          </div>
          <p style={styles.bannerSub}>{BANNERS[current].subtitle}</p>
          <p style={styles.bannerTitle}>{BANNERS[current].title}</p>
        </div>
        <div style={styles.counter}>{current + 1}/{BANNERS.length}</div>
      </div>
      <div style={styles.dots}>
        {BANNERS.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{ ...styles.dot, background: i === current ? 'var(--color-primary)' : 'var(--color-border)' }} />
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: 'relative' },
  banner: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  },
  flowerDecor: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flower: { display: 'inline-block' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 16px 20px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
    color: '#fff',
  },
  tags: { display: 'flex', gap: 6, marginBottom: 6 },
  tag: {
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(4px)',
    padding: '3px 10px',
    borderRadius: 'var(--radius-full)',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
  },
  bannerSub: { fontSize: 12, opacity: 0.85, marginBottom: 2 },
  bannerTitle: { fontSize: 18, fontWeight: 800 },
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'rgba(0,0,0,0.45)',
    color: '#fff',
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 'var(--radius-full)',
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 0 4px',
  },
  dot: { width: 6, height: 6, borderRadius: '50%', cursor: 'pointer', transition: 'background 0.2s' },
};
