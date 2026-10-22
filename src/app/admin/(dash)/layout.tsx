import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import SignOutButton from '@/components/admin/SignOutButton';
import { LOGO_VIEWBOX } from '@/components/SvgSprite';
import { getAdminSession } from '@/lib/admin/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect('/admin/login');
  const { user, isAdmin } = await getAdminSession();
  if (!user) redirect('/admin/login');

  if (!isAdmin) {
    return (
      <main className="adm-login">
        <div className="adm-login__card">
          <span className="logo adm-login__logo"><svg className="logo__full" aria-hidden="true" viewBox={LOGO_VIEWBOX}><use href="#hm-logo" /></svg></span>
          <h1>Access denied</h1>
          <p className="adm-login__lead">
            You are signed in as <strong>{user.email}</strong>, but this account is not a store admin.
          </p>
          <p className="notice">
            Ask the store owner to add your account to the <code>admins</code> table in Supabase
            (SQL: <code>insert into public.admins (user_id) values (&apos;{user.id}&apos;);</code>), then sign in again.
          </p>
          <SignOutButton className="btn btn--primary" />
        </div>
      </main>
    );
  }

  return <AdminShell email={user.email ?? 'Admin'}>{children}</AdminShell>;
}
