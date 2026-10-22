import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/admin/LoginForm';
import { LOGO_VIEWBOX } from '@/components/SvgSprite';
import { getAdminSession } from '@/lib/admin/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export const metadata: Metadata = { title: 'Sign in' };

export default async function AdminLoginPage() {
  const configured = isSupabaseConfigured();
  if (configured) {
    const { user } = await getAdminSession();
    if (user) redirect('/admin');
  }

  return (
    <main className="adm-login">
      <div className="adm-login__card">
        <Link className="logo adm-login__logo" href="/" aria-label="The Begum Beauty storefront">
          <svg className="logo__full" aria-hidden="true" viewBox={LOGO_VIEWBOX}><use href="#hm-logo" /></svg>
        </Link>
        <h1>Admin sign in</h1>
        {configured ? (
          <>
            <p className="adm-login__lead">Sign in with the email and password of your store admin account.</p>
            <LoginForm />
            <p className="notice">Accounts are created in Supabase (Authentication &gt; Users). An account can open the dashboard once its user id is added to the <code>admins</code> table.</p>
          </>
        ) : (
          <div className="adm-login__setup" role="alert">
            <h2>Supabase is not connected yet</h2>
            <p>The admin dashboard needs a Supabase project. Copy <code>.env.example</code> to <code>.env.local</code> in the project root and set these two values from your Supabase dashboard (Project Settings &gt; API Keys):</p>
            <pre><code>NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co{'\n'}NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key</code></pre>
            <p>Then run <code>supabase/schema.sql</code> in the Supabase SQL editor and restart the dev server.</p>
          </div>
        )}
        <Link className="text-link adm-login__back" href="/">Back to the store</Link>
      </div>
    </main>
  );
}
