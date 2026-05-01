import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLogById } from '../../api/logs.api';
import { getLogPosts } from '../../api/posts.api';
import type { Post } from '../../types';
import Avatar from '../../components/common/Avatar';
import CommentSheet from '../../components/log/CommentSheet';
import CameraCapture from '../../components/camera/CameraCapture';
import { useAuthStore } from '../../store/authStore';
import { toggleLike } from '../../api/posts.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function LogDetailPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'log' | 'camera'>('log');
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const queryKey = ['posts', logId];

  const { data: logData } = useQuery({
    queryKey: ['log', logId],
    queryFn: () => getLogById(logId!).then((r) => r.data.log),
    enabled: !!logId,
  });

  const { data: postsData } = useQuery({
    queryKey,
    queryFn: () => getLogPosts(logId!, undefined, undefined, 200).then((r) => r.data),
    enabled: !!logId,
  });

  const posts = postsData?.posts ?? [];
  const members = logData?.members ?? [];

  // 시간대별 그룹핑
  const hourGroups = buildHourGroups(posts, members.map((m) => m.user), user?.id);

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
        <div style={{ width: 32 }} />
      </header>

      {/* 드롭다운 메뉴 */}
      {showMenu && logData && (
        <>
          <div style={styles.menuOverlay} onClick={() => setShowMenu(false)} />
          <div style={styles.menu}>
            <div style={styles.menuInfo}>초대코드: <strong>{logData.inviteCode}</strong></div>
          </div>
        </>
      )}

      {/* 피드 */}
      {hourGroups.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center' }}>
            아직 기록이 없어요<br />
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>카메라</span>를 눌러 첫 순간을 남겨보세요
          </p>
        </div>
      ) : (
        hourGroups.map((group) => (
          <HourBlock
            key={group.hourKey}
            group={group}
            onCameraClick={() => setTab('camera')}
            onCommentClick={setCommentPostId}
            queryKey={queryKey}
          />
        ))
      )}

      {/* 하단 탭 */}
      <nav style={styles.bottomNav}>
        <button style={{ ...styles.navTab, color: tab === 'log' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} onClick={() => setTab('log')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="9" x2="9" y2="21"/>
          </svg>
          <span style={styles.navLabel}>로그</span>
        </button>
        <button style={{ ...styles.navTab, color: 'var(--color-text-secondary)' }} onClick={() => setTab('camera')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span style={styles.navLabel}>카메라</span>
        </button>
      </nav>

      {commentPostId && (
        <CommentSheet postId={commentPostId} onClose={() => setCommentPostId(null)} />
      )}
    </div>
  );
}

/* ── 시간대 블록 ── */
interface SlotMember { id: string; username: string; avatarUrl?: string | null; }
interface HourGroup {
  hourKey: string;
  label: string;
  posts: Post[];
  members: SlotMember[];
  myId?: string;
}

function buildHourGroups(posts: Post[], members: SlotMember[], myId?: string): HourGroup[] {
  const toHourKey = (d: string) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}-${dt.getHours()}`;
  };
  const toLabel = (d: string) => {
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2, '0')}:00`;
  };

  // 현재 시간 포함
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  const currentLabel = `${String(now.getHours()).padStart(2, '0')}:00`;

  const keyToLabel: Record<string, string> = { [currentKey]: currentLabel };
  posts.forEach((p) => { keyToLabel[toHourKey(p.takenAt)] = toLabel(p.takenAt); });

  const keysToPosts: Record<string, Post[]> = {};
  posts.forEach((p) => {
    const k = toHourKey(p.takenAt);
    if (!keysToPosts[k]) keysToPosts[k] = [];
    keysToPosts[k].push(p);
  });

  return Object.keys(keyToLabel)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => ({
      hourKey: key,
      label: keyToLabel[key],
      posts: keysToPosts[key] ?? [],
      members,
      myId,
    }));
}

function HourBlock({ group, onCameraClick, onCommentClick, queryKey }: {
  group: HourGroup;
  onCameraClick: () => void;
  onCommentClick: (id: string) => void;
  queryKey: unknown[];
}) {
  const postedIds = new Set(group.posts.map((p) => p.authorId));

  return (
    <section style={blockS.section}>
      <div style={blockS.hourHeader}>
        <span style={blockS.hourLabel}>{group.label}</span>
        <span style={blockS.count}>{group.posts.length}/{group.members.length}</span>
      </div>

      {/* 미촬영 슬롯 행 (멤버 전체) */}
      <div style={blockS.slotRow}>
        {group.members.map((m) => {
          const myPost = group.posts.find((p) => p.authorId === m.id);
          const isMe = m.id === group.myId;
          if (myPost) return null; // 포스트 있으면 아래에서 렌더
          return (
            <button key={m.id} onClick={isMe ? onCameraClick : undefined}
              disabled={!isMe}
              style={{ ...blockS.emptySlot, borderColor: isMe ? 'var(--color-primary)' : 'transparent', cursor: isMe ? 'pointer' : 'default' }}>
              {isMe ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              ) : null}
              <span style={blockS.slotName}>{m.username}</span>
            </button>
          );
        })}
      </div>

      {/* 촬영된 포스트들 */}
      {group.posts.map((post) => (
        <PostRow key={post.id} post={post} queryKey={queryKey} onCommentClick={onCommentClick} />
      ))}
    </section>
  );
}

function PostRow({ post, queryKey, onCommentClick }: {
  post: Post; queryKey: unknown[]; onCommentClick: (id: string) => void;
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
      <div style={blockS.mediaWrap}>
        {post.mediaType === 'VIDEO' ? (
          <video src={post.mediaUrl} style={blockS.media} autoPlay muted loop playsInline />
        ) : (
          <img src={post.mediaUrl} alt={post.caption ?? ''} style={blockS.media} />
        )}
        <div style={blockS.timeStamp}>{time}</div>
      </div>
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
  empty: { padding: '80px 24px', display: 'flex', justifyContent: 'center' },
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
  emptySlot: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60, background: 'none' },
  slotInner: { width: 56, height: 78, background: '#111', borderRadius: 8, border: '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  slotName: { fontSize: 10, color: 'var(--color-text-secondary)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  postCard: { borderTop: '1px solid var(--color-border)' },
  postHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px 6px' },
  postAuthor: { fontSize: 13, fontWeight: 700, flex: 1 },
  postTime: { fontSize: 11, color: 'var(--color-text-secondary)' },
  mediaWrap: { position: 'relative', width: '100%', aspectRatio: '9/16', background: '#000', overflow: 'hidden' },
  media: { width: '100%', height: '100%', objectFit: 'cover' },
  timeStamp: { position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 24, fontWeight: 900, textShadow: '0 2px 6px rgba(0,0,0,0.7)', letterSpacing: 2, fontVariantNumeric: 'tabular-nums', writingMode: 'vertical-rl' },
  actions: { display: 'flex', gap: 14, padding: '8px 16px 4px' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text)', fontSize: 13 },
  cnt: { fontSize: 13, fontWeight: 600 },
  caption: { padding: '2px 16px 12px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 },
};
