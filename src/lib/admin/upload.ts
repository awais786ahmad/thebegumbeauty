import { supabaseBrowser } from '@/lib/supabase/client';

export type MediaFolder = 'products' | 'categories' | 'banners' | 'reviews';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };
export const IMAGE_ACCEPT = Object.keys(TYPES).join(',');

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Uploads one image to the public `media` bucket and returns its public URL. */
export async function uploadImage(file: File, folder: MediaFolder): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new Error(`${file.name} is not a supported image. Please use JPG, PNG, WebP, AVIF or GIF.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 5 MB. Please use a smaller image.`);
  const path = `${folder}/${uid()}.${ext}`;
  const bucket = supabaseBrowser().storage.from('media');
  const { error } = await bucket.upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) {
    if (/row-level security|unauthorized|403/i.test(error.message)) throw new Error('You do not have permission to upload images. Make sure your account is an admin.');
    if (/bucket not found/i.test(error.message)) throw new Error('The "media" storage bucket is missing. Run supabase/schema.sql in the Supabase SQL editor.');
    throw new Error('Upload failed: ' + error.message);
  }
  return bucket.getPublicUrl(path).data.publicUrl;
}

export async function uploadImages(files: FileList | File[], folder: MediaFolder): Promise<string[]> {
  return Promise.all([...files].map((f) => uploadImage(f, folder)));
}
