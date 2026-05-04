import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const BUCKET = 'callog';

export const uploadToStorage = async (
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> => {
  const ext = mimetype.split('/')[1]?.split(';')[0] || 'bin';
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error(`스토리지 업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

// 클라이언트 직접 업로드용 서명 URL (Vercel 4.5MB 제한 우회)
export const getSignedUploadUrl = async (
  mimetype: string
): Promise<{ signedUrl: string; path: string }> => {
  const ext = mimetype.split('/')[1]?.split(';')[0] || 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) throw new Error(`서명 URL 생성 실패: ${error?.message}`);
  return { signedUrl: data.signedUrl, path: data.path };
};

export const getPublicUrl = (path: string): string => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
