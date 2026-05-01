import { useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Post } from '../../types';
import Avatar from '../common/Avatar';
import { toggleLike } from '../../api/posts.api';

interface PostCardProps {
  post: Post;
  queryKey: unknown[];
  onCommentClick: (postId: string) => void;
}

export default function PostCard({ post, queryKey, onCommentClick }: PostCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { mutate: like } = useMutation({
    mutationFn: () => toggleLike(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: { pages: { posts: Post[] }[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) =>
              p.id === post.id
                ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) }
                : p
            ),
          })),
        };
      });
      return { prev };
    },
    onError: (_err, _v, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
  });

  const time = new Date(post.takenAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
  const mediaUrl = post.mediaUrl.startsWith('/') ? BASE_URL + post.mediaUrl : post.mediaUrl;

  return (
    <div style={styles.card}>
      {/* 헤더 */}
      <div style={styles.cardHeader}>
        <Avatar username={post.author.username} avatarUrl={post.author.avatarUrl} size={32} />
        <div style={{ marginLeft: 8 }}>
          <p style={styles.authorName}>{post.author.username}</p>
          <p style={styles.timeText}>{time}</p>
        </div>
      </div>

      {/* 미디어 */}
      <div ref={containerRef} style={styles.media}>
        {post.mediaType === 'VIDEO' ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            style={styles.mediaEl}
            muted
            loop
            playsInline
            poster={post.thumbnailUrl ? BASE_URL + post.thumbnailUrl : undefined}
          />
        ) : (
          <img src={mediaUrl} alt={post.caption || ''} style={styles.mediaEl} />
        )}
        <div style={styles.timeOverlay}>{time}</div>
      </div>

      {/* 반응 */}
      <div style={styles.actions}>
        <button onClick={() => like()} style={styles.actionBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={post.isLiked ? 'var(--color-primary)' : 'none'} stroke={post.isLiked ? 'var(--color-primary)' : 'currentColor'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {post.likeCount > 0 && <span style={styles.count}>{post.likeCount}</span>}
        </button>
        <button onClick={() => onCommentClick(post.id)} style={styles.actionBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {post.commentCount > 0 && <span style={styles.count}>{post.commentCount}</span>}
        </button>
      </div>

      {/* 캡션 */}
      {post.caption && <p style={styles.caption}>{post.caption}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { background: 'var(--color-surface)', marginBottom: 8 },
  cardHeader: { display: 'flex', alignItems: 'center', padding: '12px 16px 8px' },
  authorName: { fontSize: 13, fontWeight: 700 },
  timeText: { fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 },
  media: { position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', overflow: 'hidden' },
  mediaEl: { width: '100%', height: '100%', objectFit: 'cover' },
  timeOverlay: {
    position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
    color: '#fff', fontSize: 22, fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.6)',
    letterSpacing: 1, fontVariantNumeric: 'tabular-nums',
  },
  actions: { display: 'flex', gap: 16, padding: '10px 16px 4px' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text)', fontSize: 13 },
  count: { fontSize: 13, fontWeight: 600 },
  caption: { padding: '2px 16px 12px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 },
};
