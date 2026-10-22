'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const SLIDES = [
  { img: '/assets/images/hero/hero-1.jpg', href: '/product/velvet-matte-lipstick', title: 'Velvet Matte Lipstick', text: 'Five shades for South Asian skin tones' },
  { img: '/assets/images/hero/hero-2.jpg', href: '/product/bridal-guest-edit', title: 'The Bridal Guest Edit', text: 'Eyes, liner and lip for wedding season' },
  { img: '/assets/images/hero/hero-3.jpg', href: '/product/everyday-glow-deal', title: 'Everyday Glow Deal', text: 'Foundation, lipstick and mascara in one deal' },
  { img: '/assets/images/hero/hero-4.jpg', href: '/product/desert-rose-palette', title: 'Desert Rose Eyeshadow Palette', text: 'Warm shades from day to evening' },
  { img: '/assets/images/hero/hero-5.jpg', href: '/product/smoky-eye-deal', title: 'Smoky Eye Deal', text: 'Everything for a soft smoky eye' },
];
const INTERVAL = 6500;

// Full-screen slideshow: crossfade + slow zoom, always playing (zoom is off for reduced motion via CSS)
export default function Hero() {
  const [cur, setCur] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [caption, setCaption] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const curRef = useRef(0);
  const go = useCallback((n: number) => {
    const c = curRef.current; if (n === c) return;
    curRef.current = n; setCur(n);
    setLeaving(c); setTimeout(() => setLeaving((l) => (l === c ? null : l)), 2000);
    setSwapping(true); setTimeout(() => { setCaption(n); setSwapping(false); }, 400);
  }, []);

  useEffect(() => {
    const schedule = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => go((cur + 1) % SLIDES.length), INTERVAL); };
    schedule();
    const onVis = () => { if (document.hidden) { if (timer.current) clearTimeout(timer.current); } else schedule(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { if (timer.current) clearTimeout(timer.current); document.removeEventListener('visibilitychange', onVis); };
  }, [cur, go]);

  const c = SLIDES[caption];
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="hero__slides" aria-hidden="true">
        {SLIDES.map((s, i) => (
          <div key={s.img} className={`hero__slide${i === cur ? ' is-active' : ''}${i === leaving ? ' is-leaving' : ''}`}>
            <img src={s.img} alt="" width={1920} height={1080} fetchPriority={i === 0 ? 'high' : 'auto'} />
          </div>
        ))}
      </div>
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__copy">
        <h1 className="hero__title reveal" id="hero-h">Your Beauty.<span>Your Signature.</span></h1>
        <p className="hero__lede reveal reveal--2">Discover your beauty essentials and curated makeup deals, delivered across Pakistan. Buy makeup online with free delivery, same-day delivery in Lahore and cash on delivery.</p>
        <div className="hero__ctas reveal reveal--3"><Link className="btn btn--primary" href="/shop">Shop now</Link><Link className="btn btn--secondary" href="/shop?category=makeup-bundles">Explore makeup deals</Link></div>
        <div className="hero__facts reveal reveal--3">
          <div><strong>Same-day in Lahore</strong>3–5 days elsewhere</div>
          <div><strong>Free delivery</strong>Across Pakistan</div>
          <div><strong>Cash on delivery</strong>Open parcel first</div>
        </div>
      </div>
      <Link className={`hero__caption${swapping ? ' is-swapping' : ''}`} href={c.href}><strong>{c.title}</strong><span>{c.text}</span></Link>
      <div className="hero__nav"><div className="hero__dots" role="group" aria-label="Slideshow">
        {SLIDES.map((s, i) => <button key={s.img} className="hero__dot" type="button" aria-label={`Show slide ${i + 1}: ${s.title}`} aria-current={i === cur ? 'true' : undefined} onClick={() => go(i)} />)}
      </div></div>
    </section>
  );
}
