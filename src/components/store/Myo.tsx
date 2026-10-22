'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import Icon from '@/components/Icon';
import type { Product } from '@/lib/types';
import { useStore } from './StoreProvider';

export function MyoBanner({ link = false }: { link?: boolean }) {
  const { myo } = useStore();
  if (!myo.active) return null;
  return (
    <div className={`myo${link ? ' myo--link' : ''}`} role="note">
      <span className="myo__badge">{myo.percent}% OFF</span>
      <div className="myo__text"><strong>Make Your Own Deal</strong><span>Add any {myo.min} or more single products to your bag and get {myo.percent}% off them automatically. Mix and match lipsticks, foundations, brushes and more.</span></div>
      {link && <Link className="btn btn--primary btn--sm myo__cta" href="/shop?type=products">Start your deal</Link>}
    </div>
  );
}

export function MyoFeature() {
  const { myo, byId } = useStore();
  if (!myo.active) return null;
  const pics = ['velvet-matte-lipstick', 'second-skin-foundation', 'signature-brush-set'].map(byId).filter(Boolean) as Product[];
  return (
    <section className="myo-feature" aria-labelledby="myo-f-h"><div className="container myo-feature__inner">
      <div className="myo-feature__visual" aria-hidden="true">
        {pics.map((p, i) => (
          <span key={p.id} style={{ display: 'contents' }}>
            {i > 0 && <span className="myo-feature__plus">+</span>}
            <figure className="myo-feature__pic"><img src={p.images[0]} alt="" loading="lazy" width={600} height={720} /><figcaption>{p.name}</figcaption></figure>
          </span>
        ))}
        <span className="myo-feature__burst"><b>{myo.percent}%</b>OFF</span>
      </div>
      <div className="myo-feature__copy">
        <span className="myo-feature__eyebrow"><Icon name="gift" className="icon--sm" />Make Your Own Deal</span>
        <h2 id="myo-f-h">Pick any {myo.min} products.<em>Get {myo.percent}% off.</em></h2>
        <p>Build your own makeup kit from our single products. Mix and match lipsticks, foundations, brushes and more. The discount is applied automatically in your bag.</p>
        <ol className="myo-feature__steps">
          <li><b>1</b><span>Choose any products you love</span></li>
          <li><b>2</b><span>Add {myo.min} or more to your bag</span></li>
          <li><b>3</b><span>{myo.percent}% off, applied automatically</span></li>
        </ol>
        <div className="myo-feature__ctas"><Link className="btn myo-feature__btn" href="/shop?type=products">Start your deal</Link><span>Cash on delivery · Free delivery across Pakistan</span></div>
      </div>
    </div></section>
  );
}

// Live note on single product pages showing how close the bag is to the deal
export function MyoProductNote({ productId }: { productId: string }) {
  const { myo, totals, lines, ready } = useStore();
  if (!myo.active || !ready) return null;
  const inBag = lines.some((l) => l.id === productId);
  let msg: React.ReactNode;
  if (totals.myoActive) msg = <><strong>Make Your Own Deal is active.</strong> {inBag ? `This product is ${myo.percent}% off in your bag.` : `Add this and it’s ${myo.percent}% off too.`}</>;
  else if (totals.myoNeed === 1 && !inBag) msg = <><strong>Add this to your bag to unlock {myo.percent}% off</strong> with Make Your Own Deal.</>;
  else { const more = totals.myoNeed - (inBag ? 0 : 1); msg = <><strong>Make Your Own Deal:</strong> buy this with {more} more {more === 1 ? 'product' : 'products'} and get {myo.percent}% off {more === 1 ? 'both' : 'all of them'}.</>; }
  return (
    <div aria-live="polite"><div className="myo myo--compact"><span className="myo__badge">{myo.percent}% OFF</span>
      <div className="myo__text"><span>{msg} <Link href="/shop?type=products">Build your deal</Link></span></div></div></div>
  );
}
