import { put } from '@vercel/blob';

export const uploadToStorage = async (
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<string> => {
  const ext = mimetype.split('/')[1]?.split(';')[0] || 'bin';
  const name = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;

  const blob = await put(`posts/${name}`, buffer, {
    contentType: mimetype,
    access: 'public',
  });

  return blob.url;
};
