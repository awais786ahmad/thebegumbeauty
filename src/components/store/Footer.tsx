'use client';
import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/Icon';
import { LOGO_VIEWBOX } from '@/components/SvgSprite';
import { telHref, waHref } from '@/lib/format';
import { useStore } from './StoreProvider';

const SOCIALS = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['youtube', 'YouTube']] as const;

function Newsletter() {
  const [msg, setMsg] = useState('');
  return (
    <div className="newsletter"><h2>New arrivals and deals, first</h2>
      <p>Join the Begum Beauty list for launches and makeup deals.</p>
      <form noValidate onSubmit={(e) => {
        e.preventDefault(); const input = e.currentTarget.querySelector('input') as HTMLInputElement;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { setMsg('Please enter a valid email address.'); input.focus(); return; }
        setMsg('Thanks for subscribing. We’ll be in touch with new arrivals and deals.'); e.currentTarget.reset();
      }}>
        <label className="visually-hidden" htmlFor="nl-email">Email address</label>
        <input id="nl-email" type="email" placeholder="Your email address" autoComplete="email" />
        <button type="submit">Subscribe</button>
      </form>
      <p className="form-msg" aria-live="polite">{msg}</p>
    </div>
  );
}

export default function Footer() {
  const { settings: s, categories, openSupport } = useStore();
  const sup = (tab?: 'faq' | 'contact') => (e: React.MouseEvent) => { e.preventDefault(); openSupport(tab); };
  return (
    <footer className="site-footer on-dark">
      <div className="container footer-top">
        <div className="footer-brand">
          <Link className="logo" href="/" aria-label="The Begum Beauty home"><svg className="logo__full" viewBox={LOGO_VIEWBOX} aria-hidden="true"><use href="#hm-logo" /></svg></Link>
          <p>The Begum Beauty is an online makeup and beauty store for customers across Pakistan, with curated makeup deals, everyday essentials, free delivery and cash on delivery.</p>
          <div className="socials">
            {SOCIALS.map(([k, label]) => (
              <a key={k} href={s[k]} target="_blank" rel="noopener" aria-label={`The Begum Beauty on ${label}`}><Icon name={k} /></a>
            ))}
          </div>
        </div>
        <nav aria-labelledby="f-shop"><h2 id="f-shop">Shop</h2><ul>
          <li><Link href="/shop?category=makeup-bundles">Makeup deals</Link></li>
          {categories.filter((c) => c.id !== 'makeup-bundles').map((c) => <li key={c.id}><Link href={`/shop?category=${c.id}`}>{c.name}</Link></li>)}
        </ul></nav>
        <nav aria-labelledby="f-help"><h2 id="f-help">Customer care</h2><ul>
          <li><a href="#support" onClick={sup('contact')}>24/7 support</a></li>
          <li><a href="#support" onClick={sup('faq')}>FAQs</a></li>
          <li><Link href="/policies#delivery">Delivery information</Link></li>
          <li><Link href="/policies#open-parcel">Open parcel facility</Link></li>
          <li><Link href="/policies#payment">Payment: cash on delivery</Link></li>
          <li><Link href="/policies#returns">Returns and replacements</Link></li>
        </ul></nav>
        <div><h2>Contact</h2><ul className="footer-contact">
          <li><Icon name="phone" /><a href={telHref(s.phone)}>{s.phone}</a></li>
          {s.whatsapp && <li><Icon name="whatsapp" /><a href={waHref(s.whatsapp)} target="_blank" rel="noopener">WhatsApp: {s.phone}</a></li>}
          <li><Icon name="mail" /><a href={`mailto:${s.email}`}>{s.email}</a></li>
          <li><Icon name="pin" /><span>{s.address}</span></li>
          <li><Icon name="clock" /><span>Support available 24/7</span></li>
        </ul></div>
        <Newsletter />
      </div>
      <div className="container footer-policies">
        <div><Icon name="bolt" />Same-Day Delivery in Lahore</div><div><Icon name="truck" />Delivery Across Pakistan in 3–5 Days</div>
        <div><Icon name="gift" />Free Delivery Across Pakistan</div><div><Icon name="box" />Open Your Parcel Before Acceptance</div><div><Icon name="cash" />Pay Cash on Delivery</div>
      </div>
      <div className="container footer-base"><span>© {new Date().getFullYear()} The Begum Beauty. All rights reserved.</span>
        <nav aria-label="Legal"><Link href="/policies#returns">Returns and replacements</Link></nav></div>
    </footer>
  );
}
