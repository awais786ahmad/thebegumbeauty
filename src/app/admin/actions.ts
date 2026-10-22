'use server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin/auth';

/** Clears the cached storefront pages after an admin edit, so shoppers see the change immediately. */
export async function revalidateStore(): Promise<{ ok: boolean; error?: string }> {
  const { user, isAdmin } = await getAdminSession();
  if (!user) return { ok: false, error: 'Not signed in.' };
  if (!isAdmin) return { ok: false, error: 'Only admins can refresh the store.' };
  revalidatePath('/', 'layout');
  return { ok: true };
}
