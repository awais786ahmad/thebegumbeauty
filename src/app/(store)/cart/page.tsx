import type { Metadata } from 'next';
import Link from 'next/link';
import CartView from '@/components/cart/CartView';

export const metadata: Metadata = { title: 'Your Shopping Bag', robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container">
      <div className="page-head"><nav aria-label="Breadcrumb"><ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">Shopping bag</li></ol></nav><h1>Your shopping bag</h1></div>
      <CartView />
    </div>
  );
}
