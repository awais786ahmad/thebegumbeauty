'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { LOGO_VIEWBOX } from '@/components/SvgSprite';
import { discountPct, fmt, productHref, telHref, waHref } from '@/lib/format';
import { faqs } from '@/lib/faqs';
import { useStore } from './StoreProvider';
import { ItemThumb, StockLabel } from './bits';

export default function Overlays() {
  return (<><Scrim /><MenuDrawer /><SearchPanel /><WishlistDrawer /><QuickView /><ToastBar /><Support /><MyoSideTab /></>);
}

function Scrim() {
  const { layer, closeLayers } = useStore();
  const open = layer === 'menu' || layer === 'wishlist';
  return <div className={`scrim${open ? ' is-open' : ''}`} onClick={closeLayers} />;
}

function MenuDrawer() {
  const { layer, closeLayers, categories, brands, openSupport } = useStore();
  const open = layer === 'menu';
  return (
    <aside className={`drawer drawer--left${open ? ' is-open' : ''}`} id="menu-drawer" aria-label="Menu" aria-hidden={!open} inert={!open}>
      <div className="drawer__head">
        <Link className="logo" href="/" aria-label="The Begum Beauty home" onClick={closeLayers}><svg className="logo__full" viewBox={LOGO_VIEWBOX} style={{ display: 'block', height: 40 }} aria-hidden="true"><use href="#hm-logo" /></svg></Link>
        <button className="icon-btn" type="button" aria-label="Close menu" onClick={closeLayers}><Icon name="close" /></button>
      </div>
      <nav className="drawer__body mobile-nav" aria-label="Mobile" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) closeLayers(); }}>
        <Link href="/">Home</Link>
        <Link href="/shop">Shop All</Link>
        <Link href="/shop?category=makeup-bundles" style={{ color: 'var(--accent)' }}>Makeup Deals</Link>
        <details><summary>Makeup Categories <Icon name="chevron" className="icon--sm" /></summary>{categories.map((c) => <Link key={c.id} href={`/shop?category=${c.id}`}>{c.name}</Link>)}</details>
        <details><summary>Brands <Icon name="chevron" className="icon--sm" /></summary>{brands.map((b) => <Link key={b.id} href={`/shop?brand=${b.id}`}>{b.name}</Link>)}</details>
        <Link href="/shop?collection=new">New Arrivals</Link>
        <Link href="/shop?collection=bestsellers">Bestsellers</Link>
        <a href="#support" onClick={(e) => { e.preventDefault(); openSupport('contact'); }}>24/7 Customer Support</a>
        <div className="mobile-nav__policies">
          <div><Icon name="bolt" className="icon--sm" />Same-Day Delivery in Lahore</div><div><Icon name="truck" className="icon--sm" />Free Delivery Across Pakistan</div><div><Icon name="cash" className="icon--sm" />Pay Cash on Delivery</div>
        </div>
      </nav>
    </aside>
  );
}

export function searchProducts(q: string, list: ReturnType<typeof useStore>['catalog'], brandName: (id: string) => string, catName: (id: string) => string) {
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return list.filter((p) => { const hay = `${p.name} ${brandName(p.brand)} ${catName(p.category)} ${p.productType}`.toLowerCase(); return words.every((w) => hay.includes(w)); });
}

function SearchPanel() {
  const { layer, closeLayers, catalog, brandName, catName } = useStore();
  const open = layer === 'search';
  const [q, setQ] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 60); }, [open]);
  const hits = useMemo(() => searchProducts(q, catalog, brandName, catName).slice(0, 8), [q, catalog, brandName, catName]);
  return (
    <div className={`search-panel${open ? ' is-open' : ''}`} id="search-panel" role="dialog" aria-label="Search" aria-hidden={!open} inert={!open}>
      <div className="container">
        <form className="search-panel__bar" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { closeLayers(); router.push('/shop?q=' + encodeURIComponent(q.trim())); } }}>
          <Icon name="search" /><label className="visually-hidden" htmlFor="search-input">Search products, brands and categories</label>
          <input ref={input} id="search-input" type="search" placeholder="Search lipstick, foundation, deals…" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="icon-btn" type="button" aria-label="Close search" onClick={closeLayers}><Icon name="close" /></button>
        </form>
        <div className="search-suggest" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) closeLayers(); }}>Popular: <Link className="chip" href="/shop?category=makeup-bundles">Makeup deals</Link><Link className="chip" href="/shop?q=lipstick">Lipstick</Link><Link className="chip" href="/shop?q=foundation">Foundation</Link><Link className="chip" href="/shop?q=palette">Eyeshadow palette</Link></div>
        <div className="search-results" aria-live="polite" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) closeLayers(); }}>
          {q.trim() && (hits.length ? (<>
            {hits.map((p) => <Link key={p.id} className="search-hit" href={productHref(p.id)}><img src={p.images[0]} alt="" /><span><strong style={{ fontWeight: 500 }}>{p.name}</strong><small>{brandName(p.brand)} · {fmt(p.price)}</small></span></Link>)}
            <Link className="search-hit" href={`/shop?q=${encodeURIComponent(q.trim())}`} style={{ justifyContent: 'center' }}><strong style={{ fontWeight: 500 }}>See all results for “{q.trim()}”</strong></Link>
          </>) : <p style={{ color: 'var(--muted)' }}>No products match “{q.trim()}”. Try a product type such as lipstick, foundation or palette.</p>)}
        </div>
      </div>
    </div>
  );
}

function WishlistDrawer() {
  const { layer, closeLayers, wish, byId, toggleWish, add } = useStore();
  const open = layer === 'wishlist';
  return (
    <aside className={`drawer drawer--right${open ? ' is-open' : ''}`} id="wishlist-drawer" aria-labelledby="wish-h" aria-hidden={!open} inert={!open}>
      <div className="drawer__head"><h2 id="wish-h">Wishlist</h2><button className="icon-btn" type="button" aria-label="Close wishlist" onClick={closeLayers}><Icon name="close" /></button></div>
      <div className="drawer__body">
        {!wish.length ? (
          <div className="empty" style={{ padding: '40px 0' }}><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg><h2 style={{ fontSize: '1.7rem' }}>Your wishlist is empty</h2><p>Tap the heart on any product to save it here.</p><Link className="btn btn--primary" href="/shop" onClick={closeLayers}>Browse products</Link></div>
        ) : wish.map((id) => { const p = byId(id)!; return (
          <div className="mini" key={id}>
            <Link href={productHref(id)} onClick={closeLayers}><img src={p.images[0]} alt={p.name} /></Link>
            <div><div className="mini__name"><Link href={productHref(id)} onClick={closeLayers}>{p.name}</Link></div><div className="mini__meta">{fmt(p.price)}</div>
              <button className="link-btn" type="button" style={{ fontSize: 12, marginTop: 4 }} onClick={() => toggleWish(id)}>Remove</button></div>
            <button className="btn btn--secondary btn--sm" type="button" disabled={p.stock <= 0} onClick={() => add(id)}>{p.stock <= 0 ? 'Sold out' : 'Add'}</button>
          </div>); })}
      </div>
      <div className="drawer__foot"><Link className="btn btn--primary btn--block" href="/cart" onClick={closeLayers}>View bag</Link></div>
    </aside>
  );
}

function QuickView() {
  const { layer, quickId, byId, brandName, closeLayers, add } = useStore();
  const open = layer === 'quickview';
  const p = quickId ? byId(quickId) : undefined;
  const [shade, setShade] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  useEffect(() => { setShade(p?.shades[0]?.name ?? null); setQty(1); }, [p]);
  const off = p ? discountPct(p) : 0;
  return (
    <div className={`modal${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="qv-title" aria-hidden={!open} inert={!open}>
      <div className="modal__backdrop" onClick={closeLayers} />
      <div className="modal__panel">
        <button className="icon-btn modal__close" type="button" aria-label="Close quick view" onClick={closeLayers}><Icon name="close" /></button>
        {p && (
          <div className="qv">
            <div className="qv__media"><img src={p.images[0]} alt={p.name} /></div>
            <div className="qv__body">
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{brandName(p.brand)}</div>
              <h2 id="qv-title" style={{ marginTop: -8 }}>{p.name}</h2>
              <div className="buybox__price"><span className="price" style={{ fontSize: '1.4rem' }}>{fmt(p.price)}</span>{off > 0 && <><span className="price__was">{fmt(p.originalPrice!)}</span><span className="badge badge--sale">Save {off}%</span></>}</div>
              <StockLabel p={p} />
              <p style={{ color: 'var(--muted)' }}>{p.description}</p>
              {p.type === 'bundle' && p.items.length > 0 && (
                <div><div className="label" style={{ marginBottom: 6 }}>Includes</div>
                  <ul className="dcard__includes">{p.items.map((x, i) => <li key={i}><ItemThumb item={x} />{x.name}</li>)}</ul>
                  <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 6 }}>One price for all {p.items.length} items</p></div>
              )}
              {p.shades.length > 0 && (
                <div><div className="buybox__shade-label">Shade: <strong>{shade}</strong></div>
                  <div className="swatches">{p.shades.map((s) => <button key={s.name} type="button" className="swatch" style={{ background: s.hex }} aria-pressed={shade === s.name} aria-label={s.name} onClick={() => setShade(s.name)} />)}</div></div>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <div className="qty"><button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button><output aria-live="polite">{qty}</output><button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(Math.max(1, p.stock), q + 1))}>+</button></div>
                <button className="btn btn--primary" type="button" style={{ flex: 1 }} disabled={p.stock <= 0} onClick={() => { add(p.id, qty, shade); closeLayers(); }}>{p.stock <= 0 ? 'Out of stock' : 'Add to bag'}</button>
              </div>
              <Link className="text-link" href={productHref(p.id)} style={{ alignSelf: 'flex-start' }} onClick={closeLayers}>See full details</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToastBar() {
  const { toast, openLayer } = useStore();
  return (
    <div className={`toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
      {toast && <><span>{toast.msg}</span>
        {toast.href && <Link href={toast.href}>{toast.label}</Link>}
        {toast.action === 'wishlist' && <a href="#" onClick={(e) => { e.preventDefault(); openLayer('wishlist'); }}>{toast.label}</a>}</>}
    </div>
  );
}

function Support() {
  const { support, openSupport, closeSupport, settings, myo } = useStore();
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const list = faqs(settings, myo).filter((f) => !q || f.join(' ').toLowerCase().includes(q.toLowerCase()));
  return (<>
    <button className="support-fab" type="button" aria-controls="support" onClick={() => openSupport()}><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg><span>24/7 Support</span></button>
    <section className={`support${support.open ? ' is-open' : ''}`} id="support" role="dialog" aria-labelledby="support-h" aria-hidden={!support.open} inert={!support.open}>
      <div className="support__head">
        <div className="support__title"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg><div><h2 id="support-h">24/7 Customer Support</h2><p>We’re Here to Help.</p></div>
          <button className="icon-btn support__close" type="button" aria-label="Close support" onClick={closeSupport}><Icon name="close" /></button></div>
        <div className="tabs" role="tablist">
          <button role="tab" type="button" aria-selected={support.tab === 'faq'} onClick={() => openSupport('faq')}>Help topics</button>
          <button role="tab" type="button" aria-selected={support.tab === 'contact'} onClick={() => openSupport('contact')}>Contact us</button>
        </div>
      </div>
      <div className="support__body" role="tabpanel">
        {support.tab === 'faq' ? (<>
          <label className="support-search"><span className="visually-hidden">Search help topics</span><Icon name="search" /><input className="input" type="search" placeholder="Search delivery, payment, deals…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <div>{list.length ? list.map((f) => <details className="acc" key={f[0]}><summary>{f[1]}</summary><div className="acc__body">{f[2]}</div></details>)
            : <p className="notice">No answers match that search. Try the Contact tab and our team will help.</p>}</div>
        </>) : (<>
          {settings.whatsapp && <a className="contact-opt" href={waHref(settings.whatsapp)} target="_blank" rel="noopener"><Icon name="whatsapp" /><span><strong>WhatsApp</strong><small>Chat with us on WhatsApp</small></span></a>}
          <a className="contact-opt" href={`mailto:${settings.email}`}><Icon name="mail" /><span><strong>Email</strong><small>{settings.email}</small></span></a>
          <a className="contact-opt" href={telHref(settings.phone)}><Icon name="phone" /><span><strong>Phone</strong><small>{settings.phone}</small></span></a>
          <form noValidate onSubmit={(e) => {
            e.preventDefault(); const f = e.currentTarget; const n = (f.elements.namedItem('name') as HTMLInputElement).value.trim(); const m = (f.elements.namedItem('msg') as HTMLTextAreaElement).value.trim();
            if (!n || !m) { setNote('Please add your name and a message.'); return; }
            if (settings.whatsapp) window.open(`${waHref(settings.whatsapp)}?text=${encodeURIComponent(`Hi, I'm ${n}. ${m}`)}`, '_blank', 'noopener');
            setNote(`Thanks, ${n}. Your message is ready to send in WhatsApp.`); f.reset();
          }}>
            <div className="field"><label htmlFor="sf-name">Your name</label><input className="input" id="sf-name" name="name" required autoComplete="name" /></div>
            <div className="field"><label htmlFor="sf-msg">How can we help?</label><textarea className="textarea" id="sf-msg" name="msg" required /></div>
            <button className="btn btn--primary">Send on WhatsApp</button>
            {note && <p className="notice">{note}</p>}
          </form>
        </>)}
      </div>
    </section>
  </>);
}

function MyoSideTab() {
  const { myo, totals, ready } = useStore();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!myo.active || location.pathname.startsWith('/checkout')) return;
    let seen = false; try { seen = localStorage.getItem('tbb-myo-seen') === '1'; } catch { /* ignore */ }
    if (seen || location.pathname === '/cart') return;
    const t = setTimeout(() => setOpen(true), 3500);
    return () => clearTimeout(t);
  }, [myo.active]);
  if (!myo.active) return null;
  const close = () => { setOpen(false); try { localStorage.setItem('tbb-myo-seen', '1'); } catch { /* ignore */ } };
  const have = Math.min(totals.myoUnits, myo.min);
  return (
    <div className={`myo-side${open ? ' is-open' : ''}`}>
      <button className="myo-side__tab" type="button" aria-expanded={open} aria-controls="myo-side-panel" onClick={() => (open ? close() : setOpen(true))}>
        <Icon name="gift" className="icon--sm" /><span><b>{myo.percent}% OFF</b> Make Your Own Deal</span>
      </button>
      {open && (
        <div className="myo-side__panel" id="myo-side-panel" role="dialog" aria-label="Make Your Own Deal">
          <button className="myo-side__close" type="button" aria-label="Close" onClick={close}><Icon name="close" className="icon--sm" /></button>
          <div className="myo-side__body">
            <span className="myo-side__big">{myo.percent}%<small>OFF</small></span>
            <h2>Make Your Own Deal</h2>
            <p>Add any {myo.min} or more single products to your bag and get {myo.percent}% off them automatically.</p>
            <div className="myo-side__progress" role="progressbar" aria-valuemin={0} aria-valuemax={myo.min} aria-valuenow={have} aria-label="Products towards your deal"><span style={{ width: `${Math.round((have / myo.min) * 100)}%` }} /></div>
            {ready && (totals.myoActive
              ? <p className="myo-side__status is-on"><Icon name="gift" className="icon--sm" />Unlocked! You’re saving {fmt(totals.myoSave)} on {totals.myoUnits} products.</p>
              : <p className="myo-side__status">{totals.myoUnits ? `You have ${totals.myoUnits} ${totals.myoUnits === 1 ? 'product' : 'products'} in your bag. Add ${totals.myoNeed} more to unlock ${myo.percent}% off.` : 'Your bag has no single products yet.'}</p>)}
            <Link className="btn btn--primary btn--block" href={totals.myoActive ? '/cart' : '/shop?type=products'} onClick={close}>{totals.myoActive ? 'View my bag' : 'Start your deal'}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
