'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import Icon, { Stars } from '@/components/Icon';
import { discountPct, fmt, productHref } from '@/lib/format';
import type { Product } from '@/lib/types';
import { ItemThumb, StockLabel } from './bits';
import { useStore } from './StoreProvider';

function WishButton({ id, className = 'icon-btn', style }: { id: string; className?: string; style?: React.CSSProperties }) {
  const { wish, toggleWish, ready } = useStore();
  const on = ready && wish.includes(id);
  return (
    <button className={className} type="button" style={style} aria-pressed={on} aria-label={`${on ? 'Remove from' : 'Save to'} wishlist`} onClick={() => toggleWish(id)}>
      <Icon name="heart" className={style ? 'icon--sm' : ''} />
    </button>
  );
}

export function ProductCard({ p, eager = false }: { p: Product; eager?: boolean }) {
  const { add, openLayer, brandName } = useStore();
  const off = discountPct(p);
  const href = productHref(p.id);
  return (
    <article className="pcard">
      <div className="pcard__media">
        <img src={p.images[0]} alt={`${p.name} by ${brandName(p.brand)}`} loading={eager ? 'eager' : 'lazy'} width={600} height={720} />
        {p.images[1] && <img src={p.images[1]} alt="" loading="lazy" width={600} height={720} />}
        <div className="pcard__badges">
          {off > 0 && <span className="badge badge--sale">Save {off}%</span>}
          {p.isNew ? <span className="badge">New</span> : p.bestseller ? <span className="badge">Bestseller</span> : null}
          {p.stock <= 0 && <span className="badge badge--muted">Out of stock</span>}
        </div>
        <WishButton id={p.id} className="icon-btn pcard__wish" />
        <div className="pcard__quick">
          <button className="btn btn--light btn--sm" type="button" onClick={() => openLayer('quickview', p.id)}>Quick view</button>
          <button className="btn btn--primary btn--sm" type="button" disabled={p.stock <= 0} onClick={() => add(p.id)}>{p.stock <= 0 ? 'Sold out' : 'Quick add'}</button>
        </div>
      </div>
      <div className="pcard__brand">{brandName(p.brand)}</div>
      <h3 className="pcard__name"><Link href={href}>{p.name}</Link></h3>
      {p.shades.length > 1 && <div className="pcard__shades" aria-label={`${p.shades.length} shades`}>{p.shades.slice(0, 6).map((s) => <i key={s.name} style={{ background: s.hex }} title={s.name} />)}</div>}
      <div className="rating"><Stars rating={p.rating} /> <span>{p.rating} ({p.reviews})</span></div>
      <div className="pcard__row">
        <span className="price">{fmt(p.price)}{off > 0 && <span className="price__was">{fmt(p.originalPrice!)}</span>}</span>
        <button className="btn btn--secondary btn--sm pcard__add" type="button" disabled={p.stock <= 0} aria-label={`Add ${p.name} to bag`} onClick={() => add(p.id)}>Add</button>
      </div>
    </article>
  );
}

export function DealCard({ b }: { b: Product }) {
  const { add, openLayer } = useStore();
  const href = productHref(b.id);
  return (
    <article className="dcard">
      <Link className="dcard__media" href={href} tabIndex={-1} aria-hidden="true">
        <img src={b.images[0]} alt="" loading="lazy" width={600} height={720} />
        <span className="dcard__off badge">{b.items.length} items</span>
      </Link>
      <div className="dcard__body">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><StockLabel p={b} /><WishButton id={b.id} style={{ width: 38, height: 38 }} /></div>
        <h3 className="dcard__name"><Link href={href}>{b.name}</Link></h3>
        <ul className="dcard__includes" aria-label="Included items">{b.items.map((x, i) => <li key={i}><ItemThumb item={x} />{x.name}</li>)}</ul>
        <div className="dcard__pricing">
          <span className="price">{fmt(b.price)}</span>
          <span className="price__save" style={{ flexBasis: '100%' }}>One price for all {b.items.length} items</span>
        </div>
        <div className="dcard__actions">
          <button className="btn btn--primary btn--sm" type="button" disabled={b.stock <= 0} onClick={() => add(b.id)}>{b.stock <= 0 ? 'Sold out' : 'Add to bag'}</button>
          <button className="btn btn--secondary btn--sm" type="button" onClick={() => openLayer('quickview', b.id)}>Quick view</button>
        </div>
        <Link className="text-link" href={href} style={{ alignSelf: 'flex-start' }}>View deal details</Link>
      </div>
    </article>
  );
}

export { WishButton };
