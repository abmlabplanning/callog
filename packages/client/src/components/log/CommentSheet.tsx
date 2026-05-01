import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, createComment, deleteComment } from '../../api/posts.api';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';

interface CommentSheetProps {
  postId: string;
  onClose: () => void;
}

export default function CommentSheet({ postId, onClose }: CommentSheetProps) {
  const [text, setText] = useState('');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = ['comments', postId];

  const { data } = useQuery({
    queryKey,
    queryFn: () => getComments(postId).then((r) => r.data.comments),
  });

  const { mutate: addComment, isPending } = useMutation({
    mutationFn: () => createComment(postId, text.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setText('');
    },
  });

  const { mutate: removeComment } = useMutation({
    mutationFn: (commentId: string) => deleteComment(postId, commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.sheet}>
        <div style={styles.handle} />
        <div style={styles.header}>
          <h3 style={styles.title}>댓글 {data?.length ?? 0}</h3>
          <button onClick={onClose} style={{ color: 'var(--color-text-secondary)' }}>✕</button>
        </div>

        <div style={styles.list}>
          {data?.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '24px 0', fontSize: 14 }}>
              첫 댓글을 남겨보세요!
            </p>
          )}
          {data?.map((c) => (
            <div key={c.id} style={styles.commentRow}>
              <Avatar username={c.author.username} avatarUrl={c.author.avatarUrl} size={30} />
              <div style={{ flex: 1, marginLeft: 10 }}>
                <span style={styles.commenter}>{c.author.username}</span>
                <span style={styles.commentText}> {c.content}</span>
                <p style={styles.commentTime}>
                  {new Date(c.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {c.author.id === user?.id && (
                <button onClick={() => removeComment(c.id)} style={styles.deleteBtn}>삭제</button>
              )}
            </div>
          ))}
        </div>

        <div style={styles.inputRow}>
          <Avatar username={user?.username} avatarUrl={user?.avatarUrl} size={30} />
          <input
            style={styles.commentInput}
            placeholder="댓글을 입력하세요..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && text.trim() && addComment()}
          />
          <button
            style={{ ...styles.sendBtn, opacity: text.trim() ? 1 : 0.4 }}
            disabled={!text.trim() || isPending}
            onClick={() => addComment()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50 },
  sheet: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 430, background: 'var(--color-surface)',
    borderRadius: '20px 20px 0 0', zIndex: 60, maxHeight: '70vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  handle: { width: 36, height: 4, background: 'var(--color-border)', borderRadius: 2, margin: '12px auto 0' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', borderBottom: '1px solid var(--color-border)',
  },
  title: { fontSize: 16, fontWeight: 700 },
  list: { flex: 1, overflowY: 'auto', padding: '8px 16px' },
  commentRow: { display: 'flex', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--color-border)' },
  commenter: { fontSize: 13, fontWeight: 700 },
  commentText: { fontSize: 13, color: 'var(--color-text)' },
  commentTime: { fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 },
  deleteBtn: { fontSize: 12, color: 'var(--color-text-secondary)', padding: '4px 0 0' },
  inputRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    borderTop: '1px solid var(--color-border)',
  },
  commentInput: {
    flex: 1, padding: '10px 14px', background: 'var(--color-bg)',
    border: 'none', borderRadius: 'var(--radius-full)', fontSize: 14,
  },
  sendBtn: { color: 'var(--color-primary)', display: 'flex', alignItems: 'center' },
};
