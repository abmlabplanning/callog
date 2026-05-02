import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Post } from '../../types';
import { toggleLike, getComments, createComment, deleteComment } from '../../api/posts.api';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';

interface Props {
  post: Post;
  queryKey: unknown[];
  onClose: () => void;
}

export default function PostDetailModal({ post, queryKey, onClose }: Props) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const commentKey = ['comments', post.id];

  // 현재 post 데이터를 queryKey 캐시에서 읽어 최신 좋아요 반영
  const cached = queryClient.getQueryData<{ posts: Post[] }>(queryKey);
  const currentPost = cached?.posts.find((p) => p.id === post.id) ?? post;

  const { data: comments } = useQuery({
    queryKey: commentKey,
    queryFn: () => getComments(post.id).then((r) => r.data.comments),
  });

  const { mutate: like } = useMutation({
    mutationFn: () => toggleLike(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: { posts: Post[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((p) =>
            p.id === post.id
              ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) }
              : p
          ),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev); },
  });

  const { mutate: addComment, isPending } = useMutation({
    mutationFn: () => createComment(post.id, commentText.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKey });
      setCommentText('');
    },
  });

  const { mutate: removeComment } = useMutation({
    mutationFn: (cid: string) => deleteComment(post.id, cid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: commentKey }),
  });

  const time = new Date(post.takenAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <>
      <div style={s.backdrop} onClick={onClose} />
      <div style={s.modal}>
        {/* 헤더 */}
        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar username={post.author.username} avatarUrl={post.author.avatarUrl} size={30} />
            <div>
              <p style={s.authorName}>{post.author.username}</p>
              <p style={s.timeText}>{time}</p>
            </div>
          </div>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* 미디어 */}
        <div style={s.mediaWrap}>
          {post.mediaType === 'VIDEO' ? (
            <video src={post.mediaUrl} style={s.media} autoPlay muted loop playsInline controls />
          ) : (
            <img src={post.mediaUrl} alt={post.caption ?? ''} style={s.media} />
          )}
          <div style={s.timeStamp}>{time}</div>
        </div>

        {/* 액션 + 캡션 */}
        <div style={s.actions}>
          <button onClick={() => like()} style={s.actionBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={currentPost.isLiked ? 'var(--color-primary)' : 'none'} stroke={currentPost.isLiked ? 'var(--color-primary)' : 'currentColor'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span style={s.actionCnt}>{currentPost.likeCount > 0 ? currentPost.likeCount : ''}</span>
          </button>
          <span style={s.commentCount}>댓글 {comments?.length ?? 0}</span>
        </div>
        {post.caption && <p style={s.caption}>{post.caption}</p>}

        {/* 댓글 목록 */}
        <div style={s.commentList}>
          {(comments ?? []).map((c) => (
            <div key={c.id} style={s.commentRow}>
              <Avatar username={c.author.username} avatarUrl={c.author.avatarUrl} size={26} />
              <div style={{ flex: 1, marginLeft: 8 }}>
                <span style={s.commenterName}>{c.author.username}</span>
                <span style={s.commentText}> {c.content}</span>
                <p style={s.commentTime}>{new Date(c.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {c.author.id === user?.id && (
                <button onClick={() => removeComment(c.id)} style={s.deleteBtn}>삭제</button>
              )}
            </div>
          ))}
        </div>

        {/* 댓글 입력 */}
        <div style={s.inputRow}>
          <Avatar username={user?.username} avatarUrl={user?.avatarUrl} size={28} />
          <input
            style={s.input}
            placeholder="댓글 입력..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commentText.trim() && addComment()}
          />
          <button
            style={{ ...s.sendBtn, opacity: commentText.trim() ? 1 : 0.4 }}
            disabled={!commentText.trim() || isPending}
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

const s: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 80 },
  modal: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 430, background: 'var(--color-surface)',
    borderRadius: '20px 20px 0 0', zIndex: 90,
    maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 },
  authorName: { fontSize: 13, fontWeight: 700 },
  timeText: { fontSize: 11, color: 'var(--color-text-secondary)' },
  closeBtn: { fontSize: 18, color: 'var(--color-text-secondary)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mediaWrap: { position: 'relative', width: '100%', aspectRatio: '9/16', background: '#000', flexShrink: 0, maxHeight: '55vh', overflow: 'hidden' },
  media: { width: '100%', height: '100%', objectFit: 'contain' },
  timeStamp: { position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 20, fontWeight: 900, textShadow: '0 2px 6px rgba(0,0,0,0.7)', letterSpacing: 2, writingMode: 'vertical-rl', pointerEvents: 'none' },
  actions: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 4px', flexShrink: 0 },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text)' },
  actionCnt: { fontSize: 13, fontWeight: 600 },
  commentCount: { fontSize: 13, color: 'var(--color-text-secondary)', marginLeft: 4 },
  caption: { padding: '2px 16px 8px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5, flexShrink: 0 },
  commentList: { flex: 1, overflowY: 'auto', padding: '4px 16px' },
  commentRow: { display: 'flex', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--color-border)' },
  commenterName: { fontSize: 12, fontWeight: 700 },
  commentText: { fontSize: 13, color: 'var(--color-text)' },
  commentTime: { fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 },
  deleteBtn: { fontSize: 11, color: 'var(--color-text-secondary)', padding: '2px 0' },
  inputRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--color-border)', flexShrink: 0 },
  input: { flex: 1, padding: '8px 12px', background: 'var(--color-bg)', border: 'none', borderRadius: 'var(--radius-full)', fontSize: 14 },
  sendBtn: { color: 'var(--color-primary)', display: 'flex', alignItems: 'center' },
};
