import type { Metadata } from 'next';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { getStoreData } from '@/lib/data';
import { telHref, waHref } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Delivery, Cash on Delivery and Store Policies',
  description: 'How delivery, payment, returns and support work when you buy makeup online from The Begum Beauty.',
  alternates: { canonical: '/policies' },
};

const B = ({ children }: { children: React.ReactNode }) => <strong style={{ color: 'var(--text)', fontWeight: 500 }}>{children}</strong>;
function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="co-section" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="trust__icon" style={{ width: 44, height: 44 }}><Icon name={icon} /></span>{title}</h2>
      <div style={{ color: 'var(--muted)', maxWidth: '44em', display: 'grid', gap: 10 }}>{children}</div>
    </section>
  );
}

export default async function PoliciesPage() {
  const { settings: s } = await getStoreData();
  return (
    <div className="container" style={{ maxWidth: 900, paddingBottom: 80 }}>
      <div className="page-head"><nav aria-label="Breadcrumb"><ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">Store policies</li></ol></nav><h1>Delivery, payment and store policies</h1><p>How delivery, payment and support work when you buy makeup online from The Begum Beauty.</p></div>
      <Section id="delivery" icon="truck" title="Delivery information">
        <p><B>Same-Day Delivery in Lahore.</B> Orders for Lahore are eligible for same-day delivery.</p>
        <p><B>Delivery Across Pakistan in 3–5 Days.</B> Orders to other cities in Pakistan have an estimated delivery time of 3–5 days.</p>
        <p><B>Free Delivery Across Pakistan.</B> Delivery is free on every order. There is no minimum order value.</p>
      </Section>
      <Section id="open-parcel" icon="box" title="Open parcel facility"><p><B>Open Your Parcel Before Acceptance.</B> You can open your parcel when it is delivered, before you accept it.</p></Section>
      <Section id="payment" icon="cash" title="Payment"><p><B>Pay Cash on Delivery.</B> Cash on Delivery is the payment method for The Begum Beauty orders. You pay the rider in cash when your order arrives.</p></Section>
      <Section id="support" icon="headset" title="24/7 customer support"><p>Our support team is available 24/7 for questions about products, makeup deals, orders and delivery. Call <a href={telHref(s.phone)}>{s.phone}</a>{s.whatsapp && <> or message us on <a href={waHref(s.whatsapp)} target="_blank" rel="noopener">WhatsApp</a></>}.</p></Section>
      <Section id="returns" icon="layers" title="Returns and replacements">
        <p><B>We Replace, We Don’t Refund.</B> If there is a problem with your order, we will replace it. We do not return payments.</p>
        <p><B>Check Your Parcel Before You Pay.</B> With our <a href="#open-parcel">open parcel facility</a>, you can open your parcel and check every item when the rider delivers it, before you accept it and pay. Because of this, payments are not refunded after an order is accepted.</p>
        <p><B>How to Request a Replacement.</B> If an item is damaged, faulty or not what you ordered, message us on {s.whatsapp ? <a href={waHref(s.whatsapp)} target="_blank" rel="noopener">WhatsApp</a> : 'WhatsApp'} or call <a href={telHref(s.phone)}>{s.phone}</a> with your order number and a photo of the item, and we will arrange a replacement.</p>
      </Section>
    </div>
  );
}
