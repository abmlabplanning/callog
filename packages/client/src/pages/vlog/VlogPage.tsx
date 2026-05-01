import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getVlogPosts } from '../../api/posts.api';
import PostCard from '../../components/log/PostCard';
import UploadModal from '../../components/log/UploadModal';
import CommentSheet from '../../components/log/CommentSheet';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export default function VlogPage() {
  const navigate = useNavigate();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const queryKey = ['vlog'];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getVlogPosts(pageParam as string | undefined).then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
  });

  const sentinelRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 style={styles.title}>vlog</h1>
          <p style={styles.sub}>나만의 공간, 매일 오전 4시에 하루 시작</p>
        </div>
        <button style={styles.uploadBtn} onClick={() => setShowUpload(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </header>

      <div>
        {posts.length === 0 && !isFetchingNextPage && (
          <div style={styles.empty}>
            <span style={{ fontSize: 40 }}>⭐</span>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
              오늘의 첫 기록을 남겨보세요
            </p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} queryKey={queryKey} onCommentClick={(id) => setCommentPostId(id)} />
        ))}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>

      {commentPostId && <CommentSheet postId={commentPostId} onClose={() => setCommentPostId(null)} />}
      {showUpload && <UploadModal logId={null} onClose={() => setShowUpload(false)} queryKey={queryKey} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 20px', background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10,
  },
  backBtn: { color: 'var(--color-text)', display: 'flex' },
  title: { fontSize: 18, fontWeight: 800 },
  sub: { fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 },
  uploadBtn: { color: 'var(--color-primary)', display: 'flex' },
  empty: { padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
};
