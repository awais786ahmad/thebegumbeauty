import type { Metadata } from 'next';
import Link from 'next/link';
import CheckoutView from '@/components/cart/CheckoutView';

export const metadata: Metadata = { title: 'Checkout | Cash on Delivery', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="container">
      <div className="page-head"><nav aria-label="Breadcrumb"><ol className="crumbs"><li><Link href="/cart">Shopping bag</Link></li><li aria-current="page">Checkout</li></ol></nav><h1>Checkout</h1></div>
      <CheckoutView />
    </div>
  );
}
