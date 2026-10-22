'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useStore } from '@/components/store/StoreProvider';
import { fmt, productHref } from '@/lib/format';
import Summary from './Summary';

export default function CartView() {
  const { lines, byId, brandName, setQty, remove, showToast, ready } = useStore();
  if (!ready) return <p style={{ padding: '40px 0', color: 'var(--muted)' }}>Loading your bag…</p>;
  if (!lines.length) return (
    <div className="empty"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg><h2>Your bag is empty</h2><p>Explore our makeup deals or browse bestsellers to get started.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}><Link className="btn btn--primary" href="/shop?category=makeup-bundles">Shop makeup deals</Link><Link className="btn btn--secondary" href="/shop">Continue shopping</Link></div></div>
  );
  return (
    <div className="cart">
      <div>
        <div role="list" aria-label="Items in your bag">
          {lines.map((l, idx) => {
            const p = byId(l.id)!; const shade = p.shades.find((s) => s.name === l.shade);
            const was = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : 0;
            return (
              <div className="line" role="listitem" key={l.id + (l.shade ?? '')}>
                <Link className="line__img" href={productHref(p.id)}><img src={p.images[0]} alt={p.name} /></Link>
                <div>
                  <div className="line__name"><Link href={productHref(p.id)}>{p.name}</Link></div>
                  <div className="line__meta"><span>{brandName(p.brand)}</span>{shade && <span className="line__variant"><i style={{ background: shade.hex }} />Shade: {shade.name}</span>}<span>{fmt(p.price)} each</span></div>
                  {p.type === 'bundle' && <div className="line__includes">Includes {p.items.map((x) => x.name).join(', ')}</div>}
                  <div className="line__controls">
                    <div className="qty qty--sm"><button type="button" aria-label={`Decrease quantity of ${p.name}`} disabled={l.qty <= 1} onClick={() => setQty(idx, l.qty - 1)}>−</button><output aria-live="polite">{l.qty}</output><button type="button" aria-label={`Increase quantity of ${p.name}`} disabled={l.qty >= p.stock} onClick={() => setQty(idx, l.qty + 1)}>+</button></div>
                    <button className="link-btn" type="button" onClick={() => { remove(idx); showToast({ msg: `Removed ${p.name} from your bag` }); }}>Remove</button>
                  </div>
                </div>
                <div className="line__price"><span className="price">{fmt(p.price * l.qty)}</span>{was > 0 && <><span className="price__was" style={{ margin: 0 }}>{fmt(was * l.qty)}</span><span className="price__save">You save {fmt((was - p.price) * l.qty)}</span></>}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 24 }}><Link className="text-link" href="/shop">Continue shopping</Link></div>
      </div>
      <aside className="summary" aria-labelledby="summary-h"><h2 id="summary-h">Order summary</h2><Summary cta={<Link className="btn btn--primary btn--block" href="/checkout">Proceed to checkout</Link>} /></aside>
    </div>
  );
}
