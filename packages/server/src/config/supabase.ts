import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
export const STORAGE_BUCKET = 'posts';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export const uploadToStorage = async (
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> => {
  const ext = mimetype.split('/')[1]?.split(';')[0] || 'bin';
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: mimetype, upsert: false });

  if (error) throw new Error(`스토리지 업로드 실패: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};
