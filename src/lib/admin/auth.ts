import 'server-only';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { supabaseServer } from '@/lib/supabase/server';

export type AdminSession = { user: User | null; isAdmin: boolean };

/** Reads the signed-in user from the session cookie and checks the admins table (via is_admin()). */
export async function getAdminSession(): Promise<AdminSession> {
  if (!isSupabaseConfigured()) return { user: null, isAdmin: false };
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data, error } = await db.rpc('is_admin');
  return { user, isAdmin: !error && data === true };
}
