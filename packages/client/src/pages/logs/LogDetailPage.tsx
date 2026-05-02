import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogById } from '../../api/logs.api';
import { getLogPosts, toggleLike } from '../../api/posts.api';
import type { Post } from '../../types';
import Avatar from '../../components/common/Avatar';
import CommentSheet from '../../components/log/CommentSheet';
import PostDetailModal from '../../components/log/PostDetailModal';
import ShareExportModal from '../../components/log/ShareExportModal';
import CameraCapture from '../../components/camera/CameraCapture';
import { useAuthStore } from '../../store/authStore';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function LogDetailPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'log' | 'camera'>('log');
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const currentHourSectionRef = useRef<HTMLElement | null>(null);

  const queryKey = ['posts', logId, selectedDate];

  const { data: logData } = useQuery({
    queryKey: ['log', logId],
    queryFn: () => getLogById(logId!).then((r) => r.data.log),
    enabled: !!logId,
  });

  const { data: postsData } = useQuery({
    queryKey,
    queryFn: () => getLogPosts(logId!, undefined, undefined, 200, selectedDate).then((r) => r.data),
    enabled: !!logId,
  });

  const posts = postsData?.posts ?? [];
  const members = (logData?.members ?? []).map((m) => m.user);
  const nowHour = new Date().getHours();

  useEffect(() => {
    if (selectedDate === todayStr() && currentHourSectionRef.current) {
      setTimeout(() => {
        currentHourSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [selectedDate, postsData]);

  const hourGroups = buildHourGroups(posts, members, user?.id, selectedDate);

  const prevDate = () => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const nextDate = () => {
    if (selectedDate >= todayStr()) return;
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formatDateLabel = (ds: string) => {
    if (ds === todayStr()) return '오늘';
    const d = new Date(ds + 'T12:00:00');
    const yest = new Date(todayStr() + 'T12:00:00');
    yest.setDate(yest.getDate() - 1);
    if (ds === yest.toISOString().slice(0, 10)) return '어제';
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  if (tab === 'camera') {
    return (
      <CameraCapture
        logs={logData ? [logData] : []}
        defaultLogId={logId}
        queryKey={queryKey}
        onClose={() => setTab('log')}
        onSuccess={() => setTab('log')}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 72 }}>
      {/* 헤더 */}
      <header style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.iconBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <button onClick={() => setShowMenu((v) => !v)} style={styles.titleBtn}>
          <span style={styles.title}>{logData?.name ?? '로그'}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button onClick={() => setShowExport(true)} style={styles.iconBtn} title="공유">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </header>

      {/* 드롭다운 */}
      {showMenu && logData && (
        <>
          <div style={styles.menuOverlay} onClick={() => setShowMenu(false)} />
          <div style={styles.menu}>
            <div style={styles.menuInfo}>초대코드: <strong>{logData.inviteCode}</strong></div>
          </div>
        </>
      )}

      {/* 날짜 내비게이션 */}
      <div style={styles.dateNav}>
        <button onClick={prevDate} style={styles.dateNavBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={styles.dateLabel}>{formatDateLabel(selectedDate)}</span>
        <button
          onClick={nextDate}
          style={{ ...styles.dateNavBtn, opacity: selectedDate >= todayStr() ? 0.3 : 1 }}
          disabled={selectedDate >= todayStr()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 24시간 피드 */}
      {hourGroups.map((group) => {
        const isCurrentHour = selectedDate === todayStr() && group.hour === nowHour;
        return (
          <HourBlock
            key={group.hourKey}
            group={group}
            onCameraClick={() => setTab('camera')}
            onCommentClick={setCommentPostId}
            onPostClick={setDetailPost}
            queryKey={queryKey}
            sectionRef={isCurrentHour ? currentHourSectionRef : undefined}
          />
        );
      })}

      {/* 하단 탭 */}
      <nav style={styles.bottomNav}>
        <button style={{ ...styles.navTab, color: 'var(--color-primary)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="9" x2="9" y2="21" />
          </svg>
          <span style={styles.navLabel}>로그</span>
        </button>
        <button style={{ ...styles.navTab, color: 'var(--color-text-secondary)' }} onClick={() => navigate(`/logs/${logId}/chat`)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span style={styles.navLabel}>채팅</span>
        </button>
        <button style={{ ...styles.navTab, color: 'var(--color-text-secondary)' }} onClick={() => setTab('camera')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span style={styles.navLabel}>카메라</span>
        </button>
      </nav>

      {commentPostId && (
        <CommentSheet postId={commentPostId} onClose={() => setCommentPostId(null)} />
      )}
      {detailPost && (
        <PostDetailModal
          post={detailPost}
          queryKey={queryKey}
          onClose={() => setDetailPost(null)}
        />
      )}
      {showExport && logData && (
        <ShareExportModal logId={logId!} logName={logData.name} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

/* ── 타입 ── */
interface SlotMember { id: string; username: string; avatarUrl?: string | null; }
interface HourGroup {
  hourKey: string;
  hour: number;
  label: string;
  posts: Post[];
  members: SlotMember[];
  myId?: string;
}

/* ── 24시간 그룹 생성 ── */
function buildHourGroups(posts: Post[], members: SlotMember[], myId: string | undefined, dateStr: string): HourGroup[] {
  const postsByHour: Record<number, Post[]> = {};
  posts.forEach((p) => {
    const h = new Date(p.takenAt).getHours();
    if (!postsByHour[h]) postsByHour[h] = [];
    postsByHour[h].push(p);
  });

  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);
  const maxHour = isToday ? now.getHours() : 23;

  return Array.from({ length: maxHour + 1 }, (_, i) => maxHour - i).map((h) => ({
    hourKey: `${dateStr}-${h}`,
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    posts: (postsByHour[h] ?? []).sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()),
    members,
    myId,
  }));
}

/* ── HourBlock ── */
function HourBlock({ group, onCameraClick, onCommentClick, onPostClick, queryKey, sectionRef }: {
  group: HourGroup;
  onCameraClick: () => void;
  onCommentClick: (id: string) => void;
  onPostClick: (p: Post) => void;
  queryKey: unknown[];
  sectionRef?: React.MutableRefObject<HTMLElement | null>;
}) {
  return (
    <section
      style={blockS.section}
      ref={sectionRef ? (el) => { sectionRef.current = el; } : undefined}
    >
      <div style={blockS.hourHeader}>
        <span style={blockS.hourLabel}>{group.label}</span>
        <span style={blockS.count}>{group.posts.length}/{group.members.length}</span>
      </div>

      {/* 미촬영 슬롯 */}
      <div style={blockS.slotRow}>
        {group.members.map((m) => {
          const hasPost = group.posts.some((p) => p.authorId === m.id);
          const isMe = m.id === group.myId;
          if (hasPost) return null;
          return (
            <button
              key={m.id}
              onClick={isMe ? onCameraClick : undefined}
              disabled={!isMe}
              style={{ ...blockS.emptySlot, borderColor: isMe ? 'var(--color-primary)' : 'transparent', cursor: isMe ? 'pointer' : 'default' }}
            >
              {isMe ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              ) : null}
              <span style={blockS.slotName}>{m.username}</span>
            </button>
          );
        })}
      </div>

      {group.posts.map((post) => (
        <PostRow
          key={post.id}
          post={post}
          queryKey={queryKey}
          onCommentClick={onCommentClick}
          onPostClick={onPostClick}
        />
      ))}
    </section>
  );
}

/* ── PostRow ── */
function PostRow({ post, queryKey, onCommentClick, onPostClick }: {
  post: Post;
  queryKey: unknown[];
  onCommentClick: (id: string) => void;
  onPostClick: (p: Post) => void;
}) {
  const queryClient = useQueryClient();
  const time = new Date(post.takenAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

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

  return (
    <div style={blockS.postCard}>
      <div style={blockS.postHeader}>
        <Avatar username={post.author.username} avatarUrl={post.author.avatarUrl} size={30} />
        <span style={blockS.postAuthor}>{post.author.username}</span>
        <span style={blockS.postTime}>{time}</span>
      </div>

      {/* 미디어 (클릭 → 상세 모달) */}
      <div style={blockS.mediaWrap} onClick={() => onPostClick(post)}>
        {post.mediaType === 'VIDEO' ? (
          <video src={post.mediaUrl} style={blockS.media} autoPlay muted loop playsInline />
        ) : (
          <img src={post.mediaUrl} alt={post.caption ?? ''} style={blockS.media} />
        )}
        <div style={blockS.timeStamp}>{time}</div>

        {/* 하트 오버레이 */}
        <button
          style={blockS.heartOverlay}
          onClick={(e) => { e.stopPropagation(); like(); }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={post.isLiked ? '#fff' : 'none'} stroke="#fff" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {post.likeCount > 0 && <span style={blockS.heartCount}>{post.likeCount}</span>}
        </button>
      </div>

      {/* 하단 액션 */}
      <div style={blockS.actions}>
        <button onClick={() => like()} style={blockS.actionBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={post.isLiked ? 'var(--color-primary)' : 'none'} stroke={post.isLiked ? 'var(--color-primary)' : 'currentColor'} strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {post.likeCount > 0 && <span style={blockS.cnt}>{post.likeCount}</span>}
        </button>
        <button onClick={() => onCommentClick(post.id)} style={blockS.actionBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {post.commentCount > 0 && <span style={blockS.cnt}>{post.commentCount}</span>}
        </button>
      </div>
      {post.caption && <p style={blockS.caption}>{post.caption}</p>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 20 },
  iconBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center', width: 32 },
  titleBtn: { display: 'flex', alignItems: 'center', gap: 4 },
  title: { fontSize: 17, fontWeight: 700 },
  menuOverlay: { position: 'fixed', inset: 0, zIndex: 30 },
  menu: { position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-elevated)', zIndex: 40, padding: '14px 20px', minWidth: 180 },
  menuInfo: { fontSize: 14, color: 'var(--color-text)' },
  dateNav: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '10px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' },
  dateNavBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center', padding: 4 },
  dateLabel: { fontSize: 15, fontWeight: 700, color: 'var(--color-text)', minWidth: 64, textAlign: 'center' },
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, height: 64, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', display: 'flex', zIndex: 20 },
  navTab: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 },
  navLabel: { fontSize: 10, fontWeight: 500 },
};

const blockS: Record<string, React.CSSProperties> = {
  section: { marginBottom: 8, background: 'var(--color-surface)' },
  hourHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' },
  hourLabel: { fontSize: 18, fontWeight: 900, color: 'var(--color-text)', letterSpacing: 1 },
  count: { fontSize: 12, color: 'var(--color-text-secondary)' },
  slotRow: { display: 'flex', gap: 8, padding: '0 16px 12px', overflowX: 'auto' },
  emptySlot: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60, background: 'none', border: '2px solid transparent', borderRadius: 8, padding: '4px 4px 0' },
  slotName: { fontSize: 10, color: 'var(--color-text-secondary)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  postCard: { borderTop: '1px solid var(--color-border)' },
  postHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 6px' },
  postAuthor: { fontSize: 13, fontWeight: 700, flex: 1 },
  postTime: { fontSize: 11, color: 'var(--color-text-secondary)' },
  mediaWrap: { position: 'relative', width: '100%', aspectRatio: '9/16', background: '#000', overflow: 'hidden', cursor: 'pointer' },
  media: { width: '100%', height: '100%', objectFit: 'cover' },
  timeStamp: { position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 24, fontWeight: 900, textShadow: '0 2px 6px rgba(0,0,0,0.7)', letterSpacing: 2, fontVariantNumeric: 'tabular-nums', writingMode: 'vertical-rl', pointerEvents: 'none' },
  heartOverlay: { position: 'absolute', bottom: 16, right: 12, background: 'rgba(0,0,0,0.35)', borderRadius: '50%', width: 44, height: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, backdropFilter: 'blur(4px)' },
  heartCount: { fontSize: 10, color: '#fff', fontWeight: 700, lineHeight: 1 },
  actions: { display: 'flex', gap: 14, padding: '8px 16px 4px' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text)', fontSize: 13 },
  cnt: { fontSize: 13, fontWeight: 600 },
  caption: { padding: '2px 16px 12px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 },
};
