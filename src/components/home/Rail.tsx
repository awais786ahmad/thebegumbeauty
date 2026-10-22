'use client';
import { useRef } from 'react';
import Icon from '@/components/Icon';
import { ProductCard } from '@/components/store/ProductCard';
import type { Product } from '@/lib/types';

export default function Rail({ products, children }: { products: Product[]; children: React.ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' });
  return (<>
    <div className="section-head"><div><h2 id="new-h">New arrivals</h2><p>Just added to the Begum Beauty range.</p></div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>{children}
        <div className="rail-controls"><button className="icon-btn" type="button" aria-label="Scroll new arrivals left" onClick={() => scroll(-1)}><Icon name="left" /></button><button className="icon-btn" type="button" aria-label="Scroll new arrivals right" onClick={() => scroll(1)}><Icon name="right" /></button></div></div></div>
    <div className="rail" ref={rail} tabIndex={0} aria-label="New arrivals">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
  </>);
}
