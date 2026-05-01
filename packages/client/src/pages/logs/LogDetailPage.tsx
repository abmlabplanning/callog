import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getLogById } from '../../api/logs.api';
import { getLogPosts } from '../../api/posts.api';
import PostCard from '../../components/log/PostCard';
import CommentSheet from '../../components/log/CommentSheet';
import UploadModal from '../../components/log/UploadModal';
import Avatar from '../../components/common/Avatar';
import { useAuthStore } from '../../store/authStore';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export default function LogDetailPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [filterMemberId, setFilterMemberId] = useState<string | undefined>();
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const queryKey = ['posts', logId, filterMemberId];

  const { data: logData } = useQuery({
    queryKey: ['log', logId],
    queryFn: () => getLogById(logId!).then((r) => r.data.log),
    enabled: !!logId,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      getLogPosts(logId!, pageParam as string | undefined, filterMemberId).then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!logId,
  });

  const sentinelRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  });

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];
  const members = logData?.members ?? [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* 헤더 */}
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.iconBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={() => setShowMenu((v) => !v)} style={styles.titleBtn}>
          <span style={styles.title}>{logData?.name ?? '로그'}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={styles.iconBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </header>

      {/* 메뉴 드롭다운 */}
      {showMenu && logData && (
        <>
          <div style={styles.menuOverlay} onClick={() => setShowMenu(false)} />
          <div style={styles.menu}>
            <div style={styles.menuInfo}>코드: {logData.inviteCode}</div>
            <button style={styles.menuItem}>멤버 ›</button>
            <button style={styles.menuItem}>설정 ›</button>
          </div>
        </>
      )}

      {/* 멤버 필터 탭 */}
      <div style={styles.memberFilter}>
        <button
          style={{ ...styles.memberChip, background: !filterMemberId ? 'var(--color-primary)' : 'var(--color-bg)' }}
          onClick={() => setFilterMemberId(undefined)}
        >
          <span style={{ color: !filterMemberId ? '#fff' : 'var(--color-text-secondary)', fontSize: 12 }}>전체</span>
        </button>
        {members.map((m) => (
          <button
            key={m.user.id}
            onClick={() => setFilterMemberId(m.user.id === filterMemberId ? undefined : m.user.id)}
            style={{ ...styles.memberChip, background: filterMemberId === m.user.id ? 'var(--color-primary)' : 'var(--color-bg)' }}
          >
            <Avatar username={m.user.username} avatarUrl={m.user.avatarUrl} size={22} />
            <span style={{ fontSize: 11, color: filterMemberId === m.user.id ? '#fff' : 'var(--color-text-secondary)', marginLeft: 4 }}>
              {m.user.username}
            </span>
          </button>
        ))}
      </div>

      {/* 피드 */}
      <div>
        {posts.length === 0 && !isFetchingNextPage && (
          <div style={styles.empty}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center' }}>
              아직 기록이 없어요<br />첫 번째 순간을 공유해보세요!
            </p>
          </div>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            queryKey={queryKey}
            onCommentClick={(id) => setCommentPostId(id)}
          />
        ))}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {isFetchingNextPage && (
          <p style={{ textAlign: 'center', padding: 16, color: 'var(--color-text-secondary)', fontSize: 13 }}>
            불러오는 중...
          </p>
        )}
      </div>

      {/* 업로드 버튼 */}
      {user && (
        <button style={styles.fab} onClick={() => setShowUpload(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* 댓글 시트 */}
      {commentPostId && (
        <CommentSheet postId={commentPostId} onClose={() => setCommentPostId(null)} />
      )}

      {/* 업로드 모달 */}
      {showUpload && (
        <UploadModal logId={logId!} onClose={() => setShowUpload(false)} queryKey={queryKey} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 20,
  },
  iconBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center', padding: 4 },
  titleBtn: { display: 'flex', alignItems: 'center', gap: 4 },
  title: { fontSize: 17, fontWeight: 700 },
  menuOverlay: { position: 'fixed', inset: 0, zIndex: 30 },
  menu: {
    position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-elevated)', zIndex: 40, minWidth: 180, overflow: 'hidden',
  },
  menuInfo: { padding: '12px 20px', fontSize: 14, color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' },
  menuItem: {
    display: 'block', width: '100%', padding: '14px 20px',
    textAlign: 'left', fontSize: 15, fontWeight: 500,
    borderBottom: '1px solid var(--color-border)',
  },
  memberFilter: {
    display: 'flex', gap: 8, padding: '10px 16px', overflowX: 'auto',
    background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
  },
  memberChip: {
    display: 'flex', alignItems: 'center', padding: '5px 10px',
    borderRadius: 'var(--radius-full)', flexShrink: 0, transition: 'background 0.15s',
  },
  empty: { padding: '60px 24px', display: 'flex', justifyContent: 'center' },
  fab: {
    position: 'fixed', bottom: 80, right: 'max(16px, calc(50% - 215px + 16px))',
    width: 52, height: 52, borderRadius: '50%',
    background: 'var(--color-primary)', boxShadow: '0 4px 12px rgba(201, 74, 43, 0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20,
  },
};
