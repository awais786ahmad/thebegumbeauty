'use client';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { fmt } from '@/lib/format';

export default function Summary({ cta }: { cta?: React.ReactNode }) {
  const { totals: t, myo } = useStore();
  return (<>
    <div className="summary__row"><span>Subtotal at regular prices</span><span>{fmt(t.regular)}</span></div>
    {t.productSave > 0 && <div className="summary__row summary__row--save"><span>Product discounts</span><span>−{fmt(t.productSave)}</span></div>}
    {t.myoSave > 0 && <div className="summary__row summary__row--save"><span>Make Your Own Deal ({myo.percent}% off)</span><span>−{fmt(t.myoSave)}</span></div>}
    <div className="summary__row"><span>Delivery</span><span>{fmt(0)} <span style={{ color: 'var(--muted)' }}>(free)</span></span></div>
    <div className="summary__row summary__row--total"><span>Total</span><span>{fmt(t.total)}</span></div>
    {t.discount > 0 && <div className="summary__row" style={{ paddingTop: 0, color: 'var(--accent)', fontSize: 'var(--fs-xs)' }}><span>You’re saving {fmt(t.discount)} on this order</span></div>}
    {t.myoNeed > 0 && t.myoUnits > 0 && <div className="myo-nudge"><Icon name="gift" className="icon--sm" /><span>Add {t.myoNeed} more {t.myoNeed === 1 ? 'product' : 'products'} to get <strong>{myo.percent}% off</strong> with Make Your Own Deal. <Link href="/shop?type=products">Browse products</Link></span></div>}
    {cta}
    <div className="summary__policies">
      <div><Icon name="truck" />Free Delivery Across Pakistan</div><div><Icon name="box" />Open Your Parcel Before Acceptance</div>
      <div><Icon name="cash" />Pay Cash on Delivery</div><div><Icon name="headset" />24/7 Customer Support</div>
    </div>
  </>);
}
