'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Icon from '@/components/Icon';
import { LOGO_VIEWBOX } from '@/components/SvgSprite';
import { useStore } from './StoreProvider';

function NavLinks() {
  const { categories, brands } = useStore();
  const path = usePathname(); const sp = useSearchParams();
  const onShop = path === '/shop';
  const cur = (on: boolean) => (on ? { 'aria-current': 'page' as const } : {});
  return (
    <ul className="nav">
      <li><Link className="nav__link" href="/" {...cur(path === '/')}><span>Home</span></Link></li>
      <li><Link className="nav__link" href="/shop" {...cur(onShop && !sp.get('category') && !sp.get('collection') && !sp.get('brand') && !sp.get('type'))}><span>Shop All</span></Link></li>
      <li><Link className="nav__link nav__link--deal" href="/shop?category=makeup-bundles" {...cur(onShop && sp.get('category') === 'makeup-bundles')}><span>Makeup Deals</span></Link></li>
      <li>
        <Link className="nav__link" href="/shop" aria-haspopup="true"><span>Categories</span><Icon name="chevron" /></Link>
        <div className="mega" aria-label="Makeup categories">
          {categories.map((c) => (
            <Link key={c.id} href={`/shop?category=${c.id}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" width={46} height={54} loading="lazy" />
              <span><strong>{c.name}</strong><small>{c.blurb}</small></span>
            </Link>
          ))}
        </div>
      </li>
      <li>
        <Link className="nav__link" href="/shop" aria-haspopup="true"><span>Brands</span><Icon name="chevron" /></Link>
        <div className="mega mega--brands" aria-label="Brands">
          {brands.map((b) => <Link key={b.id} href={`/shop?brand=${b.id}`}><span><strong>{b.name}</strong><small>{b.note}</small></span></Link>)}
        </div>
      </li>
      <li><Link className="nav__link" href="/shop?collection=new" {...cur(onShop && sp.get('collection') === 'new')}><span>New Arrivals</span></Link></li>
      <li><Link className="nav__link" href="/shop?collection=bestsellers" {...cur(onShop && sp.get('collection') === 'bestsellers')}><span>Bestsellers</span></Link></li>
    </ul>
  );
}

export default function Header() {
  const { openLayer, openSupport, count, wish, ready } = useStore();
  return (
    <header className="site-header">
      <div className="container site-header__row">
        <button className="icon-btn menu-toggle" type="button" aria-label="Open menu" aria-controls="menu-drawer" onClick={() => openLayer('menu')}><Icon name="menu" /></button>
        <Link className="logo" href="/" aria-label="The Begum Beauty home">
          <svg className="logo__full" viewBox={LOGO_VIEWBOX} aria-hidden="true"><use href="#hm-logo" /></svg>
          <svg className="logo__mark" viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg>
        </Link>
        <nav aria-label="Main"><Suspense fallback={null}><NavLinks /></Suspense></nav>
        <div className="header-tools">
          <button className="icon-btn" type="button" aria-label="Search products" aria-controls="search-panel" onClick={() => openLayer('search')}><Icon name="search" /></button>
          <button className="icon-btn hide-sm" type="button" aria-label="24/7 customer support" onClick={() => openSupport()}><Icon name="headset" /></button>
          <button className="icon-btn" type="button" aria-label="Wishlist" aria-controls="wishlist-drawer" onClick={() => openLayer('wishlist')}>
            <Icon name="heart" />{ready && wish.length > 0 && <span className="count">{wish.length}</span>}
          </button>
          <Link className="icon-btn" href="/cart" aria-label={`Shopping bag${count ? `, ${count} items` : ''}`}>
            <Icon name="bag" />{ready && count > 0 && <span className="count">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
