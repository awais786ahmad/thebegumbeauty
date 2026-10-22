'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon, { Stars } from '@/components/Icon';
import { ItemThumb, StockLabel } from '@/components/store/bits';
import { MyoProductNote } from '@/components/store/Myo';
import { WishButton } from '@/components/store/ProductCard';
import { useStore } from '@/components/store/StoreProvider';
import { discountPct, fmt } from '@/lib/format';
import type { Product } from '@/lib/types';

export default function ProductDetail({ p, fbt }: { p: Product; fbt: Product[] }) {
  const { brandName, categories, add, showToast } = useStore();
  const router = useRouter();
  const isDeal = p.type === 'bundle';
  const cat = categories.find((c) => c.id === p.category);
  const off = discountPct(p);
  const [img, setImg] = useState(0);
  const [shadeIdx, setShadeIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const shade = p.shades.length ? p.shades[shadeIdx].name : null;

  const addBtn = useRef<HTMLButtonElement>(null);
  const [sticky, setSticky] = useState(false);
  useEffect(() => {
    if (!addBtn.current || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([en]) => setSticky(!en.isIntersecting && en.boundingClientRect.top < 0));
    io.observe(addBtn.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => { document.body.classList.toggle('has-sticky-buy', sticky && p.stock > 0); return () => document.body.classList.remove('has-sticky-buy'); }, [sticky, p.stock]);
  useEffect(() => {
    if (!lightbox) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [lightbox]);

  const [chosen, setChosen] = useState<string[]>(() => [p.id, ...fbt.map((x) => x.id)]);
  const fbtAll = [p, ...fbt];
  const fbtTotal = fbtAll.filter((x) => chosen.includes(x.id)).reduce((a, x) => a + x.price, 0);
  const specRows: [string, string][] = [...Object.entries(p.specs || {}), ['SKU', p.sku], ['Category', cat?.name ?? '']];
  const brand = brandName(p.brand);

  return (<>
    <nav aria-label="Breadcrumb" className="page-head" style={{ paddingBottom: 20 }}><ol className="crumbs"><li><Link href="/">Home</Link></li>{cat && <li><Link href={`/shop?category=${cat.id}`}>{cat.name}</Link></li>}<li aria-current="page">{p.name}</li></ol></nav>
    <div className="pdp">
      <div className="gallery">
        <div className="gallery__thumbs" role="group" aria-label="Product images">
          {p.images.map((src, i) => <button key={src + i} type="button" aria-current={i === img} aria-label={`Show image ${i + 1} of ${p.images.length}`} onClick={() => setImg(i)}><img src={src} alt="" width={84} height={100} /></button>)}
        </div>
        <div className={`gallery__main${zoom ? ' is-zoom' : ''}`} role="button" tabIndex={0} aria-label="Enlarge image"
          onMouseMove={(e) => { if (!window.matchMedia('(hover: hover)').matches) return; const r = e.currentTarget.getBoundingClientRect(); setZoom(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); }}
          onMouseLeave={() => setZoom(null)} onClick={() => setLightbox(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightbox(true); } }}>
          <img src={p.images[img]} alt={`${p.name} by ${brand}`} width={600} height={720} style={zoom ? { transformOrigin: zoom } : undefined} />
          <span className="gallery__hint badge"><Icon name="zoom" className="icon--sm" />Click to enlarge</span>
        </div>
      </div>
      <div className="buybox">
        <Link className="buybox__brand" href={`/shop?brand=${p.brand}`}>{brand}</Link>
        <h1>{p.name}</h1>
        <div className="rating"><Stars rating={p.rating} /><span>{p.rating} · {p.reviews} reviews</span></div>
        <div className="buybox__price"><span className="price">{fmt(p.price)}</span>{off > 0 && <><span className="price__was">{fmt(p.originalPrice!)}</span><span className="badge badge--sale">Save {off}%</span></>}</div>
        {isDeal && <p className="price__save" style={{ fontSize: 'var(--fs-sm)', marginTop: -10 }}>One price for all {p.items.length} items in this deal</p>}
        <p style={{ color: 'var(--muted)', maxWidth: '34em' }}>{p.description}</p>
        {!isDeal && <MyoProductNote productId={p.id} />}
        {isDeal && (
          <section className="bundle-box" aria-labelledby="inc-h">
            <h2 id="inc-h">What’s in this deal</h2>
            <ul>{p.items.map((x, i) => <li key={i}><ItemThumb item={x} size={56} /><span>{x.name}</span></li>)}</ul>
            <div className="bundle-box__sum"><div><span>{p.items.length} items</span><span>Included</span></div><div><span>Deal price</span><strong>{fmt(p.price)}</strong></div></div>
          </section>
        )}
        {p.shades.length > 0 && (
          <div><div className="buybox__shade-label">Shade: <strong>{shade}</strong></div>
            <div className="swatches" role="group" aria-label="Choose a shade">{p.shades.map((s, i) => <button key={s.name} type="button" className="swatch" style={{ background: s.hex }} aria-pressed={i === shadeIdx} aria-label={s.name} onClick={() => setShadeIdx(i)} />)}</div></div>
        )}
        <div><StockLabel p={p} /></div>
        <div className="buybox__actions">
          <div className="qty"><button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button><output aria-live="polite">{qty}</output><button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(Math.max(1, p.stock), q + 1))}>+</button></div>
          <button ref={addBtn} className="btn btn--primary" type="button" disabled={p.stock <= 0} onClick={() => add(p.id, qty, shade)}>{p.stock <= 0 ? 'Out of stock' : 'Add to bag'}</button>
          <WishButton id={p.id} />
        </div>
        <button className="btn btn--secondary" type="button" disabled={p.stock <= 0} onClick={() => { add(p.id, qty, shade, true); router.push('/checkout'); }}>Buy now, pay on delivery</button>
        <div className="delivery-box">
          <div><Icon name="bolt" /><span><strong>Same-Day Delivery in Lahore</strong><p>Orders for Lahore are eligible for same-day delivery.</p></span></div>
          <div><Icon name="truck" /><span><strong>Delivery Across Pakistan in 3–5 Days</strong><p>Free delivery to every city, no minimum order.</p></span></div>
        </div>
        <div className="policy-badges">
          <div className="policy-badge"><Icon name="truck" />Free delivery across Pakistan</div>
          <div className="policy-badge"><Icon name="box" />Open your parcel before acceptance</div>
          <div className="policy-badge"><Icon name="cash" />Pay cash on delivery</div>
          <SupportBadge />
        </div>
        <div>
          {p.features.length > 0 && <details className="acc" open><summary>Key features</summary><div className="acc__body"><ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul></div></details>}
          <details className="acc"><summary>Specifications</summary><div className="acc__body"><dl className="spec">{specRows.map(([k, v]) => <span key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd>{v}</dd></span>)}</dl></div></details>
          {p.usage && <details className="acc"><summary>How to use</summary><div className="acc__body">{p.usage}</div></details>}
          <details className="acc"><summary>Delivery, open parcel and payment</summary><div className="acc__body">Free delivery across Pakistan. Same-day delivery in Lahore and 3–5 days to other cities. You can open your parcel before accepting it, and you pay cash on delivery.</div></details>
        </div>
      </div>
    </div>

    {fbt.length > 0 && p.stock > 0 && (
      <section className="section--tight" aria-label="Frequently bought together">
        <div className="section-head"><h2>Frequently bought together</h2></div>
        <div className="fbt">
          <div className="fbt__items">
            {fbtAll.map((x, i) => (
              <span key={x.id} style={{ display: 'contents' }}>
                {i > 0 && <span className="fbt__plus" aria-hidden="true">+</span>}
                <label className="fbt__item"><img src={x.images[0]} alt="" loading="lazy" />
                  <span className="check" style={{ padding: 0 }}><input type="checkbox" checked={chosen.includes(x.id)} onChange={(e) => setChosen((c) => (e.target.checked ? [...c, x.id] : c.filter((y) => y !== x.id)))} /> <span>{i ? '' : 'This item: '}{x.name}</span></span>
                  <span className="price">{fmt(x.price)}</span></label>
              </span>
            ))}
          </div>
          <div className="fbt__sum"><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>Total for selected items</span><span className="price">{fmt(fbtTotal)}</span>
            <button className="btn btn--primary" type="button" disabled={!chosen.length} onClick={() => { chosen.forEach((id) => add(id, id === p.id ? qty : 1, id === p.id ? shade : null, true)); showToast({ msg: `${chosen.length} ${chosen.length === 1 ? 'item' : 'items'} added to your bag`, href: '/cart', label: 'View bag' }); }}>{chosen.length > 1 ? `Add ${chosen.length} items to bag` : 'Add to bag'}</button>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>Default shades are added. You can change shades from each product page.</p></div>
        </div>
      </section>
    )}

    <div className={`modal lightbox${lightbox ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Enlarged product image" aria-hidden={!lightbox} inert={!lightbox}>
      <div className="modal__backdrop" onClick={() => setLightbox(false)} />
      <div className="modal__panel"><button className="icon-btn modal__close" type="button" aria-label="Close image" onClick={() => setLightbox(false)}><Icon name="close" /></button>{lightbox && <img src={p.images[img]} alt={`${p.name} by ${brand}`} />}</div>
    </div>

    {p.stock > 0 && (
      <div className={`sticky-buy${sticky ? ' is-on' : ''}`} aria-hidden={!sticky}>
        <div><div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{p.name}</div><div className="price">{fmt(p.price)}</div></div>
        <button className="btn btn--primary" type="button" tabIndex={sticky ? 0 : -1} onClick={() => add(p.id, qty, shade)}>Add to bag</button>
      </div>
    )}
  </>);
}

function SupportBadge() {
  const { openSupport } = useStore();
  return <button type="button" className="policy-badge" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => openSupport()}><Icon name="headset" /><span>24/7 support <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>Get help</span></span></button>;
}
