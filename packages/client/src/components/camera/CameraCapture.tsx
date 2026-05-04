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
    const recorder = new MediaRecorder(stream, { mimeType });
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
    onError: () => setError('업로드에 실패했습니다. 다시 시도해주세요.'),
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
    return (
      <div style={s.overlay}>
        <div style={s.previewWrap}>
          {/* 헤더 */}
          <div style={s.header}>
            <button onClick={onClose} style={s.iconBtn}>✕</button>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>미리보기</span>
            <div style={{ width: 32 }} />
          </div>

          {/* 비디오 미리보기 */}
          <div style={{ position: 'relative', flex: 1, background: '#000' }}>
            <video ref={previewRef} src={videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay loop muted playsInline />
            <div style={s.timeOverlay}>{timeLabel}</div>
          </div>

          {/* 캡션 + 로그 선택 */}
          <div style={s.bottomSheet}>
            {logs.length > 1 && !defaultLogId && (
              <div style={{ marginBottom: 16 }}>
                <p style={s.label}>어느 로그에 올릴까요?</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {logs.map((log) => (
                    <button key={log.id} onClick={() => setSelectedLogId(log.id)}
                      style={{ ...s.logChip, background: selectedLogId === log.id ? 'var(--color-primary)' : 'var(--color-bg)', color: selectedLogId === log.id ? '#fff' : 'var(--color-text)' }}>
                      {log.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              style={s.captionInput}
              placeholder={`${timeLabel} 지금 이 순간을 표현하면?`}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            {error && <p style={{ color: '#e00', fontSize: 13, marginTop: 8 }}>{error}</p>}
            <button
              style={{ ...s.submitBtn, opacity: isPending ? 0.6 : 1 }}
              disabled={isPending}
              onClick={() => upload()}
            >
              {isPending ? '업로드 중...' : '공유하기'}
            </button>
          </div>
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
  previewWrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  iconBtn: { color: '#fff', fontSize: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  timeOverlay: { position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 32, fontWeight: 900, letterSpacing: 2, textShadow: '0 2px 8px rgba(0,0,0,0.7)', fontVariantNumeric: 'tabular-nums', writingMode: 'vertical-rl', textOrientation: 'mixed' },
  countdownOverlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#fff', fontSize: 80, fontWeight: 900, textShadow: '0 4px 16px rgba(0,0,0,0.8)', opacity: 0.85 },
  progressBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.3)' },
  progressFill: { height: '100%', background: 'var(--color-primary)', transition: 'width 0.9s linear' },
  controlRow: { height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' },
  recordBtn: { width: 72, height: 72, borderRadius: '50%', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  recordInner: { width: 52, height: 52, borderRadius: '50%', background: 'var(--color-primary)' },
  bottomSheet: { padding: '20px 20px 36px', background: '#111' },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10 },
  logChip: { padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  captionInput: { width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: '12px 16px', color: '#fff', fontSize: 14, boxSizing: 'border-box' },
  submitBtn: { marginTop: 14, width: '100%', height: 50, borderRadius: 25, background: 'var(--color-primary)', color: '#fff', fontSize: 16, fontWeight: 700 },
  closeBtn: { padding: '10px 28px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, fontSize: 15 },
  errorBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' },
};

const slotS: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', minWidth: 64 },
  black: { width: 60, height: 80, background: '#111', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 10, color: 'var(--color-text-secondary)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
