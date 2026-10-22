'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';
import { placeOrder, type PlaceOrderInput } from '@/app/(store)/actions';
import Icon from '@/components/Icon';
import { useStore } from '@/components/store/StoreProvider';
import { CITIES, PHONE_RE, deliveryEstimate, fmt } from '@/lib/format';
import { track } from '@/lib/meta';
import Summary from './Summary';

type Field = keyof PlaceOrderInput;
const RULES: Partial<Record<Field, (v: string) => boolean>> = {
  name: (v) => v.trim().length >= 3,
  phone: (v) => PHONE_RE.test(v.replace(/[\s-]/g, '')),
  city: (v) => !!v,
  address: (v) => v.trim().length >= 10,
};

type Confirmed = { orderNo: string; total: number; myoDiscount: number; name: string; city: string; items: { name: string; qty: number; price: number; shade: string | null }[] };

export default function CheckoutView() {
  const { lines, byId, totals, clear, ready } = useStore();
  const [form, setForm] = useState<PlaceOrderInput>({ name: '', phone: '', city: '', address: '', notes: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, boolean>>>({});
  const [alert, setAlert] = useState('');
  const [done, setDone] = useState<Confirmed | null>(null);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const checkoutSent = useRef(false);
  useEffect(() => {
    if (!ready || !lines.length || checkoutSent.current) return;
    checkoutSent.current = true;
    track('InitiateCheckout', { content_ids: lines.map((l) => l.id), content_type: 'product', num_items: lines.reduce((a, l) => a + l.qty, 0), value: totals.total, currency: 'PKR' });
  }, [ready, lines, totals.total]);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const v = e.target.value; setForm((f) => ({ ...f, [k]: v }));
    if (errors[k] && RULES[k]) setErrors((x) => ({ ...x, [k]: !RULES[k]!(v) }));
  };
  const blur = (k: Field) => () => { if (form[k] && RULES[k]) setErrors((x) => ({ ...x, [k]: !RULES[k]!(form[k]) })); };

  if (done) {
    const est = deliveryEstimate(done.city);
    return (
      <div className="confirm">
        <svg className="mark" viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg>
        <h1 tabIndex={-1}>Thank you, {done.name.split(' ')[0]}</h1>
        <p>Your order <strong>{done.orderNo}</strong> has been placed. Our team will call you to confirm it.</p>
        <div className="confirm__card">
          {done.items.map((i, k) => <div className="summary__row" key={k}><span>{i.name} × {i.qty}{i.shade && <span style={{ color: 'var(--muted)' }}> ({i.shade})</span>}</span><span>{fmt(i.price * i.qty)}</span></div>)}
          {done.myoDiscount > 0 && <div className="summary__row summary__row--save"><span>Make Your Own Deal discount</span><span>−{fmt(done.myoDiscount)}</span></div>}
          <div className="summary__row"><span>Delivery</span><span>{fmt(0)} (free)</span></div>
          <div className="summary__row summary__row--total"><span>Total to pay on delivery</span><span>{fmt(done.total)}</span></div>
          <div className="summary__policies">
            <div><Icon name={est.icon} />{est.title}{done.city !== 'Lahore' ? ` to ${done.city}` : ''}</div>
            <div><Icon name="cash" />Pay Cash on Delivery</div>
            <div><Icon name="box" />Open Your Parcel Before Acceptance</div>
            <div><Icon name="headset" />Questions? 24/7 Customer Support is here to help</div>
          </div>
        </div>
        <Link className="btn btn--primary" href="/shop">Continue shopping</Link>
      </div>
    );
  }

  if (!ready) return <p style={{ padding: '40px 0', color: 'var(--muted)' }}>Loading your bag…</p>;
  if (!lines.length) return (
    <div className="empty"><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg><h2>Your bag is empty</h2><p>Add a product or makeup deal to your bag before checking out.</p><Link className="btn btn--primary" href="/shop">Start shopping</Link></div>
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const bad = (Object.keys(RULES) as Field[]).filter((k) => !RULES[k]!(form[k]));
    setErrors(Object.fromEntries(bad.map((k) => [k, true])));
    if (bad.length) { setAlert(`Please check ${bad.length === 1 ? 'one field' : `${bad.length} fields`} highlighted below.`); formRef.current?.querySelector<HTMLElement>(`[name="${bad[0]}"]`)?.focus(); return; }
    setAlert('');
    const snapshot = lines.map((l) => { const p = byId(l.id)!; return { name: p.name, qty: l.qty, price: p.price, shade: l.shade }; });
    start(async () => {
      const r = await placeOrder(form, lines);
      if (!r.ok) { setAlert(r.error); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      track('Purchase', { content_ids: lines.map((l) => l.id), contents: lines.map((l) => ({ id: l.id, quantity: l.qty })), content_type: 'product', value: r.total, currency: 'PKR' }, r.orderNo);
      clear(); setDone({ orderNo: r.orderNo, total: r.total, myoDiscount: r.myoDiscount, name: form.name.trim(), city: form.city, items: snapshot });
      window.scrollTo({ top: 0 });
    });
  };
  const est = deliveryEstimate(form.city);
  const err = (k: Field) => (errors[k] ? ' field--error' : '');

  return (
    <div className="checkout">
      <form ref={formRef} noValidate onSubmit={submit}>
        <div className={`form-alert${alert ? ' is-on' : ''}`} role="alert" tabIndex={-1}>{alert}</div>
        <section className="co-section" aria-labelledby="co-contact"><h2 id="co-contact">Contact details</h2>
          <div className="fields">
            <div className={`field span-2${err('name')}`}><label htmlFor="co-name">Full name</label><input className="input" id="co-name" name="name" autoComplete="name" required value={form.name} onChange={set('name')} onBlur={blur('name')} aria-invalid={!!errors.name} /><span className="error-msg">Please enter your full name.</span></div>
            <div className={`field span-2${err('phone')}`}><label htmlFor="co-phone">Mobile number</label><input className="input" id="co-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" required aria-describedby="co-phone-hint" value={form.phone} onChange={set('phone')} onBlur={blur('phone')} aria-invalid={!!errors.phone} />
              <span className="hint" id="co-phone-hint">Pakistani mobile number, for example 0300 1234567 or +92 300 1234567. Our rider will call this number.</span><span className="error-msg">Enter a valid Pakistani mobile number, such as 0300 1234567.</span></div>
          </div>
        </section>
        <section className="co-section" aria-labelledby="co-delivery"><h2 id="co-delivery">Delivery</h2>
          <div className="fields">
            <div className={`field span-2${err('city')}`}><label htmlFor="co-city">City</label><select className="select" id="co-city" name="city" required value={form.city} onChange={set('city')} aria-invalid={!!errors.city}><option value="">Select your city</option>{CITIES.map((c) => <option key={c}>{c}</option>)}</select><span className="error-msg">Please choose your city.</span></div>
            <div className={`field span-2${err('address')}`}><label htmlFor="co-address">Delivery address</label><textarea className="textarea" id="co-address" name="address" autoComplete="street-address" required placeholder="House number, street, area and nearby landmark" value={form.address} onChange={set('address')} onBlur={blur('address')} aria-invalid={!!errors.address} /><span className="error-msg">Please enter your full delivery address.</span></div>
            <div className="field span-2"><label htmlFor="co-notes">Order notes <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label><textarea className="textarea" id="co-notes" name="notes" placeholder="Shade questions, delivery instructions…" value={form.notes} onChange={set('notes')} /></div>
          </div>
          <div className="estimate" aria-live="polite"><Icon name={est.icon} /><span><strong>{est.title}</strong><p>{est.text}</p></span></div>
          <div className="estimate" style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--text)' }}><Icon name="box" /><span><strong>Open Your Parcel Before Acceptance</strong><p style={{ color: 'var(--muted)' }}>You can open your parcel when it arrives, before you accept it.</p></span></div>
        </section>
        <section className="co-section" aria-labelledby="co-pay" style={{ border: 0 }}><h2 id="co-pay">Payment</h2>
          <div className="pay-option"><Icon name="cash" /><span><strong>Pay Cash on Delivery</strong><small>Pay the rider in cash when your parcel arrives. No online payment needed.</small></span><span className="badge badge--dark">Selected</span></div>
          <button className="btn btn--primary btn--block" type="submit" disabled={pending} style={{ marginTop: 28, minHeight: 56, fontSize: 'var(--fs-md)' }}>{pending ? 'Placing your order…' : `Place order · ${fmt(totals.total)}`}</button>
        </section>
      </form>
      <aside className="summary" aria-labelledby="co-sum-h">
        <h2 id="co-sum-h">Your order</h2>
        {lines.map((l) => { const p = byId(l.id)!; return <div className="mini" key={l.id + (l.shade ?? '')}><img src={p.images[0]} alt="" /><div><div className="mini__name">{p.name}</div><div className="mini__meta">Qty {l.qty}{l.shade ? ` · ${l.shade}` : ''}</div></div><span className="price" style={{ fontSize: '1rem' }}>{fmt(p.price * l.qty)}</span></div>; })}
        <div style={{ marginTop: 12 }}><Summary /></div>
        <Link className="text-link" href="/cart" style={{ justifySelf: 'start', marginTop: 14 }}>Edit bag</Link>
      </aside>
    </div>
  );
}
