const BUCKET = 'callog';

const getSupabaseUrl = () => process.env.SUPABASE_URL!;
const getServiceKey = () => process.env.SUPABASE_SERVICE_KEY!;

export const uploadToStorage = async (
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> => {
  const ext = mimetype.split('/')[1]?.split(';')[0] || 'bin';
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;

  const url = `${getSupabaseUrl()}/storage/v1/object/${BUCKET}/${path}`;
  const key = getServiceKey();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': mimetype,
      'x-upsert': 'false',
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`스토리지 업로드 실패: ${text}`);
  }

  return `${getSupabaseUrl()}/storage/v1/object/public/${BUCKET}/${path}`;
};

// 클라이언트 직접 업로드용 서명 URL (Vercel 4.5MB 제한 우회)
export const getSignedUploadUrl = async (
  mimetype: string
): Promise<{ signedUrl: string; path: string }> => {
  const ext = mimetype.split('/')[1]?.split(';')[0] || 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const url = `${getSupabaseUrl()}/storage/v1/object/upload/sign/${BUCKET}/${path}`;
  const key = getServiceKey();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`서명 URL 생성 실패: ${text}`);
  }

  const data = await res.json() as { signedURL: string; token: string; url: string };
  const signedUrl = data.signedURL || data.url;
  return { signedUrl, path };
};

export const getPublicUrl = (path: string): string => {
  return `${getSupabaseUrl()}/storage/v1/object/public/${BUCKET}/${path}`;
};
