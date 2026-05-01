import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLogPost, createVlogPost } from '../../api/posts.api';

interface UploadModalProps {
  logId: string | null;
  onClose: () => void;
  queryKey: unknown[];
}

export default function UploadModal({ logId, onClose, queryKey }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('파일을 선택해주세요.');
      return logId ? createLogPost(logId, file, caption) : createVlogPost(file, caption);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onClose();
    },
  });

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <div style={styles.header}>
          <h3 style={styles.title}>업로드</h3>
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}>✕</button>
        </div>

        <div style={styles.body}>
          {!preview ? (
            <button style={styles.dropZone} onClick={() => fileRef.current?.click()}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 8 }}>
                영상 또는 사진 선택
              </p>
            </button>
          ) : (
            <div style={styles.previewBox}>
              {file?.type.startsWith('video/') ? (
                <video src={preview} style={styles.previewMedia} controls muted />
              ) : (
                <img src={preview} alt="preview" style={styles.previewMedia} />
              )}
              <button style={styles.changeBtn} onClick={() => { setPreview(null); setFile(null); }}>
                다시 선택
              </button>
            </div>
          )}

          <input
            className="input-field"
            placeholder="캡션을 입력해주세요. (선택)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{ marginTop: 12 }}
          />

          <button
            className="btn-primary"
            style={{ marginTop: 16 }}
            disabled={!file || isPending}
            onClick={() => mutate()}
          >
            {isPending ? '업로드 중...' : '업로드'}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 },
  sheet: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 430, background: 'var(--color-surface)',
    borderRadius: '20px 20px 0 0', zIndex: 60,
  },
  handle: { width: 36, height: 4, background: 'var(--color-border)', borderRadius: 2, margin: '12px auto 0' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderBottom: '1px solid var(--color-border)',
  },
  title: { fontSize: 16, fontWeight: 700 },
  body: { padding: '16px 20px 32px' },
  dropZone: {
    width: '100%', height: 140, border: '2px dashed var(--color-border)',
    borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    background: 'var(--color-bg)',
  },
  previewBox: { position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: 200 },
  previewMedia: { width: '100%', height: '100%', objectFit: 'cover' },
  changeBtn: {
    position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)',
    color: '#fff', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: 12,
  },
};
