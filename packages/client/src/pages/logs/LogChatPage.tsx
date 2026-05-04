import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLogById } from '../../api/logs.api';
import { getMessages, createMessage, toggleReaction } from '../../api/chat.api';
import type { Message } from '../../types';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../../components/common/Avatar';

export default function LogChatPage() {
  const { logId } = useParams<{ logId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryKey = ['chat', logId];

  const { data: logData } = useQuery({
    queryKey: ['log', logId],
    queryFn: () => getLogById(logId!).then((r) => r.data.log),
    enabled: !!logId,
  });

  const { data: messages = [] } = useQuery({
    queryKey,
    queryFn: () => getMessages(logId!).then((r) => r.data.messages),
    enabled: !!logId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => createMessage(logId!, { content: text.trim(), parentId: replyTo?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setText('');
      setReplyTo(null);
    },
  });

  const { mutate: react } = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      toggleReaction(messageId, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const isMe = (msg: Message) => msg.authorId === user?.id;

  return (
    <div style={s.page}>
      {/* 헤더 */}
      <header style={s.header}>
        <button onClick={() => navigate(`/logs/${logId}`)} style={s.backBtn}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <p style={s.logName}>{logData?.name ?? '채팅'}</p>
          <p style={s.memberCount}>{logData?.members?.length ?? 0}명</p>
        </div>
      </header>

      {/* 메시지 목록 */}
      <div style={s.list}>
        {messages.length === 0 && (
          <div style={s.empty}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, textAlign: 'center' }}>
              아직 메시지가 없어요<br />첫 메시지를 보내보세요!
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMe={isMe(msg)}
            onReact={(emoji) => react({ messageId: msg.id, emoji })}
            onReply={() => setReplyTo(msg)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 답글 표시 */}
      {replyTo && (
        <div style={s.replyBanner}>
          <div style={{ flex: 1 }}>
            <p style={s.replyLabel}>답글: {replyTo.author.username}</p>
            <p style={s.replyPreview}>
              {replyTo.content ?? (replyTo.post ? '📹 쇼츠' : '')}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} style={s.replyClose}>✕</button>
        </div>
      )}

      {/* 입력창 */}
      <div style={s.inputRow}>
        <Avatar username={user?.username} avatarUrl={user?.avatarUrl} size={28} />
        <input
          style={s.input}
          placeholder="메시지 입력..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && text.trim() && send()}
        />
        <button
          style={{ ...s.sendBtn, opacity: text.trim() && !isPending ? 1 : 0.4 }}
          disabled={!text.trim() || isPending}
          onClick={() => send()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isMe, onReact, onReply }: {
  msg: Message;
  isMe: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const time = new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const heartReaction = msg.reactions.find((r) => r.emoji === '❤️');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 4, padding: '2px 16px' }}>
      {/* 답글 출처 */}
      {msg.parent && (
        <div style={{ ...b.replyRef, alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
          <span style={b.replyRefUser}>{msg.parent.author.username}</span>
          <span style={b.replyRefText}>{msg.parent.content ?? '📹 쇼츠'}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
        {!isMe && <Avatar username={msg.author.username} avatarUrl={msg.author.avatarUrl} size={28} />}

        <div onClick={() => setShowActions((v) => !v)} style={{ cursor: 'pointer' }}>
          {/* 쇼츠 카드 */}
          {msg.post ? (
            <div style={b.postCard}>
              <div style={b.postThumb}>
                {msg.post.mediaType === 'VIDEO' ? (
                  <video src={msg.post.mediaUrl} style={b.postMedia} muted playsInline autoPlay loop />
                ) : (
                  <img src={msg.post.thumbnailUrl ?? msg.post.mediaUrl} alt="" style={b.postMedia} />
                )}
              </div>
              <div style={b.postMeta}>
                <p style={b.postAuthor}>{msg.post.author.username}의 쇼츠</p>
                {msg.post.caption && <p style={b.postCaption}>{msg.post.caption}</p>}
              </div>
            </div>
          ) : (
            /* 텍스트 버블 */
            <div style={{ ...b.bubble, background: isMe ? 'var(--color-primary)' : 'var(--color-surface)', color: isMe ? '#fff' : 'var(--color-text)', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              {!isMe && <p style={b.sender}>{msg.author.username}</p>}
              <p style={b.text}>{msg.content}</p>
            </div>
          )}
        </div>

        <p style={b.time}>{time}</p>
      </div>

      {/* 하트 반응 표시 */}
      {heartReaction && (
        <button
          onClick={() => onReact('❤️')}
          style={{ ...b.reactionChip, alignSelf: isMe ? 'flex-end' : 'flex-start', background: heartReaction.isReacted ? 'rgba(201,74,43,0.12)' : 'var(--color-bg)' }}
        >
          ❤️ {heartReaction.count}
        </button>
      )}

      {/* 액션 팝업 */}
      {showActions && (
        <div style={{ ...b.actions, alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
          <button style={b.actionBtn} onClick={() => { onReact('❤️'); setShowActions(false); }}>❤️ 하트</button>
          <button style={b.actionBtn} onClick={() => { onReply(); setShowActions(false); }}>↩ 답글</button>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--bottom-nav-height))', background: 'var(--color-bg)', maxWidth: 430, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 },
  backBtn: { color: 'var(--color-text)', display: 'flex', alignItems: 'center', width: 32 },
  logName: { fontSize: 15, fontWeight: 700 },
  memberCount: { fontSize: 11, color: 'var(--color-text-secondary)' },
  list: { flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column' },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' },
  replyBanner: { display: 'flex', alignItems: 'center', padding: '8px 16px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', flexShrink: 0 },
  replyLabel: { fontSize: 11, color: 'var(--color-primary)', fontWeight: 700, marginBottom: 2 },
  replyPreview: { fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 },
  replyClose: { color: 'var(--color-text-secondary)', fontSize: 16, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  inputRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', flexShrink: 0 },
  input: { flex: 1, padding: '10px 14px', background: 'var(--color-bg)', border: 'none', borderRadius: 'var(--radius-full)', fontSize: 14 },
  sendBtn: { color: 'var(--color-primary)', display: 'flex', alignItems: 'center' },
};

const b: Record<string, React.CSSProperties> = {
  bubble: { maxWidth: 220, padding: '8px 12px' },
  sender: { fontSize: 10, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 2 },
  text: { fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word' },
  time: { fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 2, flexShrink: 0 },
  postCard: { maxWidth: 200, background: 'var(--color-surface)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  postThumb: { width: '100%', aspectRatio: '9/16', background: '#000', maxHeight: 180, overflow: 'hidden' },
  postMedia: { width: '100%', height: '100%', objectFit: 'cover' },
  postMeta: { padding: '8px 10px' },
  postAuthor: { fontSize: 11, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 },
  postCaption: { fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  reactionChip: { fontSize: 12, padding: '3px 8px', borderRadius: 12, border: '1px solid var(--color-border)', marginTop: 3, cursor: 'pointer' },
  actions: { display: 'flex', gap: 6, marginTop: 4 },
  actionBtn: { padding: '5px 12px', borderRadius: 16, background: 'var(--color-surface)', fontSize: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', border: '1px solid var(--color-border)' },
  replyRef: { padding: '4px 10px', background: 'rgba(0,0,0,0.06)', borderLeft: '2px solid var(--color-primary)', borderRadius: '0 6px 6px 0', marginBottom: 4, maxWidth: 200 },
  replyRefUser: { fontSize: 10, fontWeight: 700, color: 'var(--color-primary)' },
  replyRefText: { fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
