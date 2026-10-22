'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'That email and password do not match an account. Please check them and try again.';
  if (/email not confirmed/i.test(message)) return 'This email address has not been confirmed yet. Open the confirmation link Supabase sent you, then sign in.';
  if (/rate limit|too many/i.test(message)) return 'Too many sign-in attempts. Please wait a minute and try again.';
  if (/failed to fetch|network/i.test(message)) return 'Could not reach the server. Check your internet connection and try again.';
  return message || 'Sign-in failed. Please try again.';
}

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Enter your email address and password.'); return; }
    setBusy(true);
    try {
      const { error: authError } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
      if (authError) { setError(friendlyAuthError(authError.message)); setBusy(false); return; }
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : ''));
      setBusy(false);
    }
  }

  return (
    <form className="adm-login__form" onSubmit={onSubmit} noValidate>
      <p className={`form-alert${error ? ' is-on' : ''}`} role="alert">{error}</p>
      <div className="field">
        <label htmlFor="login-email">Email address</label>
        <input className="input" id="login-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="login-password">Password</label>
        <input className="input" id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn--primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
