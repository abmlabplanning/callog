interface AvatarProps {
  username?: string;
  avatarUrl?: string | null;
  size?: number;
}

export default function Avatar({ username = '?', avatarUrl, size = 36 }: AvatarProps) {
  const initials = username.slice(0, 1).toUpperCase();
  const colors = ['#C94A2B', '#E8674A', '#8B2500', '#D4894A', '#A83520'];
  const color = colors[username.charCodeAt(0) % colors.length];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: size * 0.4,
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}
