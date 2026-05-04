import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogById } from '../../api/logs.api';
import { getLogPosts, toggleLike } from '../../api/posts.api';
import type { Post } from '../../types';
import Avatar from '../../components/common/Avatar';
import PostDetailModal from '../../components/log/PostDetailModal';
import ShareExportModal from '../../components/log/ShareExportModal';
import CameraCapture from '../../components/camera/CameraCapture';
import { useAuthStore } from '../../store/authStore';

const todayStr = () => new Date().toISOString().slice(0, 10);

function getVisibleHours(dateStr: string): number[] {
  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);
  if (!isToday) return Array.from({ length: 24 }, (_, i) => i);
  const current = now.getHours();
  const maxHour = now.getMinutes() >= 50 ? Math.min(current + 1, 23) : current;
  return Array.from({ length: maxHour + 1 }, (_, i) => i);
}

interface SlotMember { id: string; username: string; avatarUrl?: string | null; }

export default function LogDetailPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
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
  const members: SlotMember[] = (logData?.members ?? []).map((m) => m.user);
  const hours = getVisibleHours(selectedDate);

  // 최신(오른쪽 끝) 시간 슬롯으로 자동 이동
  useEffect(() => {
    if (!scrollRef.current || hours.length === 0) return;
    const lastIdx = hours.length - 1;
    setActiveIndex(lastIdx);
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = lastIdx * scrollRef.current.offsetWidth;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, postsData]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.offsetWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    if (idx !== activeIndex && idx >= 0 && idx < hours.length) {
      setActiveIndex(idx);
      if (chipRef.current) {
        const chipW = 42;
        chipRef.current.scrollLeft = Math.max(0, (idx + 0.5) * chipW - chipRef.current.offsetWidth / 2);
      }
    }
  };

  const postsByHour: Record<number, Post[]> = {};
  posts.forEach((p) => {
    const h = new Date(p.takenAt).getHours();
    if (!postsByHour[h]) postsByHour[h] = [];
    postsByHour[h].push(p);
  });

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

  const scrollToHour = (idx: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: idx * scrollRef.current.offsetWidth, behavior: 'smooth' });
    setActiveIndex(idx);
  };

  return (
    <>
      <style>{`.hr-scroller::-webkit-scrollbar,.hr-page::-webkit-scrollbar,.chip-row::-webkit-scrollbar{display:none}`}</style>
      <div style={s.page}>
        {/* 헤더 */}
        <header style={s.header}>
          <button onClick={() => navigate(-1)} style={s.iconBtn}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={() => setShowMenu((v) => !v)} style={s.titleBtn}>
            <span style={s.title}>{logData?.name ?? '로그'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button onClick={() => setShowExport(true)} style={s.iconBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </header>

        {showMenu && logData && (
          <>
            <div style={s.menuOverlay} onClick={() => setShowMenu(false)} />
            <div style={s.menu}>
              <div style={s.menuInfo}>초대코드: <strong>{logData.inviteCode}</strong></div>
            </div>
          </>
        )}

        {/* 날짜 네비게이션 */}
        <div style={s.dateNav}>
          <button onClick={prevDate} style={s.dateNavBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={s.dateLabel}>{formatDateLabel(selectedDate)}</span>
          <button
            onClick={nextDate}
            style={{ ...s.dateNavBtn, opacity: selectedDate >= todayStr() ? 0.3 : 1 }}
            disabled={selectedDate >= todayStr()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* 시간 슬롯 가로 스크롤러 */}
        <div
          ref={scrollRef}
          className="hr-scroller"
          style={s.scroller}
          onScroll={handleScroll}
        >
          {hours.length === 0 ? (
            <div style={s.empty}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>아직 기록이 없어요</p>
            </div>
          ) : (
            hours.map((hour) => (
              <HourPage
                key={`${selectedDate}-${hour}`}
                hour={hour}
                posts={(postsByHour[hour] ?? []).sort(
                  (a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime()
                )}
                members={members}
                myId={user?.id}
                queryKey={queryKey}
                onPostClick={setDetailPost}
                onCameraClick={() => setShowCamera(true)}
              />
            ))
          )}
        </div>

        {/* 시간 칩 내비게이션 */}
        <div ref={chipRef} className="chip-row" style={s.chipRow}>
          {hours.map((hour, idx) => {
            const hasPosts = (postsByHour[hour] ?? []).length > 0;
            const isActive = idx === activeIndex;
            return (
              <button
                key={hour}
                onClick={() => scrollToHour(idx)}
                style={{
                  ...s.chip,
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isActive ? '#fff' : hasPosts ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  fontWeight: isActive || hasPosts ? 700 : 400,
                  borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                {String(hour).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* 플로팅 액션 버튼 */}
        <div style={s.fabGroup}>
          <button style={s.fabChat} onClick={() => navigate(`/logs/${logId}/chat`)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button style={s.fabCamera} onClick={() => setShowCamera(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>
      </div>

      {showCamera && (
        <CameraCapture
          logs={logData ? [logData] : []}
          defaultLogId={logId}
          queryKey={queryKey}
          onClose={() => setShowCamera(false)}
          onSuccess={() => setShowCamera(false)}
        />
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
    </>
  );
}

/* ── HourPage ── */
function HourPage({ hour, posts, members, myId, queryKey, onPostClick, onCameraClick }: {
  hour: number;
  posts: Post[];
  members: SlotMember[];
  myId?: string;
  queryKey: unknown[];
  onPostClick: (p: Post) => void;
  onCameraClick: () => void;
}) {
  const label = `${String(hour).padStart(2, '0')}:00`;

  return (
    <div className="hr-page" style={ps.page}>
      <div style={ps.labelBar}>
        <span style={ps.hourLabel}>{label}</span>
        <span style={ps.count}>{posts.length}/{members.length}</span>
      </div>
      <div style={ps.grid}>
        {members.map((member) => {
          const post = posts.find((p) => p.authorId === member.id);
          return (
            <MemberCell
              key={member.id}
              member={member}
              post={post}
              isMe={member.id === myId}
              queryKey={queryKey}
              onPostClick={onPostClick}
              onCameraClick={onCameraClick}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── MemberCell ── */
function MemberCell({ member, post, isMe, queryKey, onPostClick, onCameraClick }: {
  member: SlotMember;
  post?: Post;
  isMe: boolean;
  queryKey: unknown[];
  onPostClick: (p: Post) => void;
  onCameraClick: () => void;
}) {
  const queryClient = useQueryClient();

  const { mutate: like } = useMutation({
    mutationFn: () => toggleLike(post!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: { posts: Post[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((p) =>
            p.id === post!.id
              ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) }
              : p
          ),
        };
      });
      return { prev };
    },
    onError: (_e, _v, ctx: { prev: unknown } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
    },
  });

  if (post) {
    return (
      <div style={cs.cell} onClick={() => onPostClick(post)}>
        {post.mediaType === 'VIDEO' ? (
          <video src={post.mediaUrl} style={cs.media} autoPlay muted loop playsInline />
        ) : (
          <img src={post.mediaUrl} alt="" style={cs.media} />
        )}
        <div style={cs.nameBar}>
          <span style={cs.username}>{member.username}</span>
        </div>
        <button
          style={cs.heartBtn}
          onClick={(e) => { e.stopPropagation(); like(); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={post.isLiked ? '#fff' : 'none'} stroke="#fff" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {post.likeCount > 0 && <span style={cs.heartCount}>{post.likeCount}</span>}
        </button>
      </div>
    );
  }

  if (isMe) {
    return (
      <div style={cs.cell}>
        <button style={cs.emptyMe} onClick={onCameraClick}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <span style={cs.cameraName}>{member.username}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={cs.cell}>
      <div style={cs.emptyOther}>
        <Avatar username={member.username} avatarUrl={member.avatarUrl} size={36} />
        <span style={cs.emptyName}>{member.username}</span>
      </div>
    </div>
  );
}

/* ── 스타일 ── */
const s: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative',
    height: 'calc(100vh - var(--bottom-nav-height))',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--color-bg)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  iconBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center', width: 32 },
  titleBtn: { display: 'flex', alignItems: 'center', gap: 4 },
  title: { fontSize: 17, fontWeight: 700 },
  menuOverlay: { position: 'fixed', inset: 0, zIndex: 30 },
  menu: {
    position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-elevated)', zIndex: 40, padding: '14px 20px', minWidth: 180,
  },
  menuInfo: { fontSize: 14, color: 'var(--color-text)' },
  dateNav: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
    padding: '10px 16px',
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border)',
    flexShrink: 0,
  },
  dateNavBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center', padding: 4 },
  dateLabel: { fontSize: 15, fontWeight: 700, color: 'var(--color-text)', minWidth: 64, textAlign: 'center' },
  scroller: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
  },
  empty: {
    flex: '0 0 100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  chipRow: {
    display: 'flex', gap: 4,
    padding: '8px 12px',
    overflowX: 'auto',
    flexShrink: 0,
    background: 'var(--color-surface)',
    borderTop: '1px solid var(--color-border)',
    scrollbarWidth: 'none',
  },
  chip: {
    flexShrink: 0, fontSize: 12,
    padding: '4px 8px', borderRadius: 12,
    border: '1px solid', transition: 'all 0.15s',
    minWidth: 34, textAlign: 'center',
  },
  fabGroup: {
    position: 'absolute', bottom: 60, right: 16,
    display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10,
  },
  fabChat: {
    width: 46, height: 46, borderRadius: '50%',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--color-border)',
  },
  fabCamera: {
    width: 52, height: 52, borderRadius: '50%',
    background: 'var(--color-primary)',
    boxShadow: '0 2px 12px rgba(201,74,43,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

const ps: Record<string, React.CSSProperties> = {
  page: {
    flex: '0 0 100%',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto',
    scrollSnapAlign: 'start',
    scrollbarWidth: 'none',
  },
  labelBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px 10px',
    flexShrink: 0,
  },
  hourLabel: { fontSize: 22, fontWeight: 900, color: 'var(--color-text)', letterSpacing: 1 },
  count: { fontSize: 12, color: 'var(--color-text-secondary)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 2,
    padding: '0 2px 80px',
  },
};

const cs: Record<string, React.CSSProperties> = {
  cell: { position: 'relative', aspectRatio: '3/4', background: '#111', overflow: 'hidden' },
  media: { width: '100%', height: '100%', objectFit: 'cover' },
  nameBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '18px 8px 6px',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
  },
  username: { color: '#fff', fontSize: 11, fontWeight: 700 },
  heartBtn: {
    position: 'absolute', bottom: 6, right: 6,
    background: 'rgba(0,0,0,0.4)', borderRadius: '50%',
    width: 32, height: 32,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  },
  heartCount: { fontSize: 9, color: '#fff', fontWeight: 700, lineHeight: 1 },
  emptyMe: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    border: '2px dashed var(--color-primary)',
    background: 'rgba(201,74,43,0.08)',
    cursor: 'pointer',
  },
  cameraName: { fontSize: 11, color: 'var(--color-primary)', marginTop: 6, fontWeight: 600 },
  emptyOther: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  emptyName: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
};
