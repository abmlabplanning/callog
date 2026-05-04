import { useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Log } from '../../types';
import { createLogPost } from '../../api/posts.api';
import Avatar from '../common/Avatar';

type Phase = 'ready' | 'recording' | 'preview' | 'uploading';

interface Props {
  logs: Log[];
  defaultLogId?: string;
  queryKey?: unknown[];
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_SEC = 4;

export default function CameraCapture({ logs, defaultLogId, queryKey, onClose, onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [countdown, setCountdown] = useState(MAX_SEC);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedLogId, setSelectedLogId] = useState(defaultLogId ?? logs[0]?.id ?? '');
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  // 카메라 스트림 시작
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: true })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => setError('카메라 접근 권한이 필요합니다.'));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2_500_000,  // 2.5Mbps → 4초 영상 ≈ 1.25MB (Vercel 4.5MB 제한 이내)
    });
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const recorded = new Blob(chunksRef.current, { type: mimeType });
      setBlob(recorded);
      setVideoUrl(URL.createObjectURL(recorded));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setPhase('preview');
    };
    recorder.start();
    setPhase('recording');
    setCountdown(MAX_SEC);

    let remaining = MAX_SEC;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        recorder.stop();
      }
    }, 1000);
  };

  const stopEarly = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    recorderRef.current?.stop();
  };

  const { mutate: upload, isPending } = useMutation({
    mutationFn: () => {
      if (!blob || !selectedLogId) throw new Error('필수 데이터 없음');
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `record.${ext}`, { type: blob.type });
      return createLogPost(selectedLogId, file, caption || undefined);
    },
    onSuccess: () => {
      if (queryKey) queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['posts', selectedLogId] });
      onSuccess();
    },
    onError: (err) => setError((err as Error).message || '업로드에 실패했습니다. 다시 시도해주세요.'),
  });

  const now = new Date();
  const timeLabel = `${String(now.getHours()).padStart(2, '0')}:00`;

  // 에러 화면
  if (error && phase === 'ready') {
    return (
      <div style={s.overlay}>
        <div style={s.errorBox}>
          <p style={{ color: '#fff', fontSize: 15, textAlign: 'center', marginBottom: 20 }}>{error}</p>
          <button onClick={onClose} style={s.closeBtn}>닫기</button>
        </div>
      </div>
    );
  }

  // 미리보기 화면
  if (phase === 'preview' && videoUrl) {
    const selectedLog = logs.find((l) => l.id === selectedLogId);
    return (
      <div style={s.overlay}>
        {/* 헤더 (절대 위치) */}
        <div style={s.previewHeader}>
          <button onClick={onClose} style={s.iconBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span style={s.previewTitle}>{selectedLog?.name ?? '로그'}</span>
          <button
            onClick={() => upload()}
            disabled={isPending}
            style={{ ...s.sendBtn, opacity: isPending ? 0.5 : 1 }}
          >
            {isPending ? (
              <span style={{ color: '#fff', fontSize: 13 }}>...</span>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </button>
        </div>

        {/* 영상 (캡션 오버레이 포함) */}
        <div style={s.videoArea}>
          <video
            ref={previewRef}
            src={videoUrl}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            autoPlay loop muted playsInline
          />
          <div style={s.timeOverlay}>{timeLabel}</div>
          {caption ? (
            <div style={s.captionOverlay}>
              <span style={s.captionOnVideo}>{caption}</span>
            </div>
          ) : null}
        </div>

        {/* 하단: 로그 선택 + 캡션 입력 */}
        <div style={s.bottomSheet}>
          <p style={s.logSectionLabel}>보낼 로그방:</p>
          <div style={s.logList}>
            {logs.map((log) => {
              const isSel = log.id === selectedLogId;
              const memberNames = log.members?.map((m) => m.user.username).join(', ') ?? '';
              return (
                <button key={log.id} onClick={() => setSelectedLogId(log.id)} style={s.logRow}>
                  <div style={{ ...s.radioCircle, background: isSel ? 'var(--color-primary)' : 'transparent', borderColor: isSel ? 'var(--color-primary)' : '#555' }}>
                    {isSel && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={s.logRowName}>{log.name}</p>
                    {memberNames && <p style={s.logRowMembers}>{memberNames}</p>}
                  </div>
                </button>
              );
            })}
          </div>

          {error && <p style={{ color: '#f55', fontSize: 13, marginBottom: 8 }}>{error}</p>}

          <input
            style={s.captionInput}
            placeholder={`${timeLabel} 지금 이 순간은?`}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
      </div>
    );
  }

  // 카메라 화면
  return (
    <div style={s.overlay}>
      <div style={s.cameraWrap}>
        {/* 헤더 */}
        <div style={s.header}>
          <button onClick={onClose} style={s.iconBtn}>✕</button>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{timeLabel}</span>
          <div style={{ width: 32 }} />
        </div>

        {/* 카메라 뷰 */}
        <div style={{ flex: 1, position: 'relative', background: '#000' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            muted playsInline autoPlay />
          {phase === 'recording' && (
            <>
              <div style={s.timeOverlay}>{timeLabel}</div>
              <div style={s.countdownOverlay}>{countdown}</div>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${((MAX_SEC - countdown) / MAX_SEC) * 100}%` }} />
              </div>
            </>
          )}
        </div>

        {/* 로그 선택 (복수 로그) */}
        {!defaultLogId && logs.length > 1 && phase === 'ready' && (
          <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.6)', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {logs.map((log) => (
              <button key={log.id} onClick={() => setSelectedLogId(log.id)}
                style={{ ...s.logChip, background: selectedLogId === log.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)', color: '#fff', flexShrink: 0 }}>
                {log.name}
              </button>
            ))}
          </div>
        )}

        {/* 촬영 버튼 */}
        <div style={s.controlRow}>
          {phase === 'ready' ? (
            <button style={s.recordBtn} onClick={startRecording}>
              <div style={s.recordInner} />
            </button>
          ) : (
            <button style={{ ...s.recordBtn, border: '4px solid #fff' }} onClick={stopEarly}>
              <div style={{ width: 24, height: 24, background: '#fff', borderRadius: 4 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 멤버 슬롯용 미니 아바타 (LogDetailPage에서 사용)
export function MemberSlot({ username, avatarUrl, onClick, isMe }: {
  username: string; avatarUrl?: string | null; onClick?: () => void; isMe?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={!onClick} style={{ ...slotS.wrap, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ ...slotS.black, border: isMe && onClick ? '2px dashed var(--color-primary)' : '2px solid transparent' }}>
        {isMe && onClick && (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        )}
      </div>
      <Avatar username={username} avatarUrl={avatarUrl} size={20} />
      <span style={slotS.name}>{username}</span>
    </button>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column' },
  cameraWrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  // 미리보기 헤더 (absolute, 영상 위에 오버레이)
  previewHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'linear-gradient(rgba(0,0,0,0.5) 0%, transparent 100%)',
  },
  previewTitle: { color: '#fff', fontWeight: 700, fontSize: 16, flex: 1, textAlign: 'center' },
  sendBtn: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'var(--color-primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  // 영상 영역: 화면의 약 55%
  videoArea: { position: 'relative', width: '100%', height: '55%', background: '#000', flexShrink: 0 },
  // 타임스탬프 오버레이 (세로 쓰기)
  timeOverlay: { position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: 2, textShadow: '0 2px 8px rgba(0,0,0,0.7)', fontVariantNumeric: 'tabular-nums', writingMode: 'vertical-rl', textOrientation: 'mixed' },
  // 캡션 오버레이: 영상 하단 30% 위치에 실시간 표시
  captionOverlay: {
    position: 'absolute', bottom: '20%', left: 0, right: 0,
    display: 'flex', justifyContent: 'center', padding: '0 20px',
    pointerEvents: 'none',
  },
  captionOnVideo: {
    color: '#fff', fontSize: 18, fontWeight: 700,
    textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)',
    textAlign: 'center', lineHeight: 1.4, wordBreak: 'break-word',
  },
  // 하단 시트
  bottomSheet: { flex: 1, background: '#111', display: 'flex', flexDirection: 'column', padding: '12px 16px 24px', overflowY: 'auto' },
  logSectionLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 },
  logList: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 },
  logRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
  },
  radioCircle: {
    width: 22, height: 22, borderRadius: '50%',
    border: '2px solid', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logRowName: { color: '#fff', fontSize: 15, fontWeight: 700 },
  logRowMembers: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 1 },
  // 캡션 입력창
  captionInput: {
    width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none',
    borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14,
    boxSizing: 'border-box', marginTop: 'auto',
  },
  // 카메라 화면 공통
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  iconBtn: { color: '#fff', fontSize: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  countdownOverlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', fontSize: 80, fontWeight: 900, textShadow: '0 4px 16px rgba(0,0,0,0.8)', opacity: 0.85 },
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.3)' },
  progressFill: { height: '100%', background: 'var(--color-primary)', transition: 'width 0.9s linear' },
  controlRow: { height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  recordBtn: { width: 72, height: 72, borderRadius: '50%', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  recordInner: { width: 52, height: 52, borderRadius: '50%', background: 'var(--color-primary)' },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10 },
  logChip: { padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  closeBtn: { padding: '10px 28px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, fontSize: 15 },
  errorBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' },
};

const slotS: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', minWidth: 64 },
  black: { width: 60, height: 80, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 10, color: 'var(--color-text-secondary)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
