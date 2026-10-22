'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { LOGO_VIEWBOX } from '@/components/SvgSprite';
import SignOutButton from './SignOutButton';

type NavItem = { href: string; label: string; icon: string; group?: string };

const NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'grid' },
  { href: '/admin/products', label: 'Products', icon: 'tag', group: 'Catalogue' },
  { href: '/admin/bundles', label: 'Makeup bundles', icon: 'layers' },
  { href: '/admin/categories', label: 'Categories', icon: 'folder' },
  { href: '/admin/brands', label: 'Brands', icon: 'star' },
  { href: '/admin/orders', label: 'Orders', icon: 'bag', group: 'Sales' },
  { href: '/admin/promotions', label: 'Promotions', icon: 'gift', group: 'Marketing and store' },
  { href: '/admin/reviews', label: 'Customer reviews', icon: 'chat' },
  { href: '/admin/settings', label: 'Store settings', icon: 'settings' },
];

const isActive = (path: string, href: string) => (href === '/admin' ? path === '/admin' : path === href || path.startsWith(href + '/'));

export default function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname() ?? '/admin';
  const [open, setOpen] = useState(false);
  const current = NAV.find((n) => isActive(path, n.href)) ?? NAV[0];

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <a className="skip-link" href="#adm-body">Skip to content</a>
      <div className="adm">
        <aside className={`adm-side on-dark${open ? ' is-open' : ''}`} aria-label="Admin navigation" id="adm-side">
          <Link className="logo" href="/admin" aria-label="The Begum Beauty admin home">
            <svg className="logo__full" aria-hidden="true" viewBox={LOGO_VIEWBOX}><use href="#hm-logo" /></svg>
          </Link>
          <nav className="adm-nav">
            {NAV.map((n) => (
              <div key={n.href} className="adm-nav__item">
                {n.group && <div className="adm-nav__label">{n.group}</div>}
                <Link href={n.href} aria-current={n === current ? 'page' : undefined}>
                  <Icon name={n.icon} />{n.label}
                </Link>
              </div>
            ))}
          </nav>
          <div className="adm-side__foot">
            <Link className="adm-link" href="/" target="_blank" rel="noopener"><Icon name="store" />View storefront</Link>
          </div>
        </aside>
        <div className="adm-main">
          <header className="adm-top">
            <button className="icon-btn adm-menu" type="button" aria-label="Open admin menu" aria-controls="adm-side" aria-expanded={open} onClick={() => setOpen(true)}>
              <Icon name="menu" />
            </button>
            <h1>{current.label}</h1>
            <div className="adm-top__right">
              <span className="adm-user" title={email}>{email}</span>
              <span className="avatar" aria-hidden="true">{(email.trim()[0] ?? 'A').toUpperCase()}</span>
              <SignOutButton />
            </div>
          </header>
          <main className="adm-body" id="adm-body">{children}</main>
        </div>
      </div>
      <div className={`scrim adm-scrim${open ? ' is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
    </>
  );
}
