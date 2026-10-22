/* eslint-disable @next/next/no-img-element */
import Icon from '@/components/Icon';
import type { Product } from '@/lib/types';

export function StockLabel({ p }: { p: Pick<Product, 'stock'> }) {
  if (p.stock <= 0) return <span className="stock stock--out">Out of stock</span>;
  if (p.stock <= 10) return <span className="stock stock--low">Only {p.stock} left</span>;
  return <span className="stock">In stock</span>;
}

export function ItemThumb({ item, size = 32 }: { item: { name: string; image: string }; size?: number }) {
  return item.image
    ? <img src={item.image} alt="" loading="lazy" width={size} height={size} />
    : <span className="item-ph" aria-hidden="true" style={{ width: size, height: size }}><Icon name="box" className="icon--sm" /></span>;
}
