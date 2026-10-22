/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import Icon, { Stars } from '@/components/Icon';
import Hero from '@/components/home/Hero';
import Rail from '@/components/home/Rail';
import { MyoBanner, MyoFeature } from '@/components/store/Myo';
import { DealCard, ProductCard } from '@/components/store/ProductCard';
import { getBanners, getStoreData, getTestimonials } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

export default async function Home() {
  const [{ catalog, categories, brands }, banners, testimonials] = await Promise.all([getStoreData(), getBanners(), getTestimonials()]);
  const deals = catalog.filter((p) => p.type === 'bundle');
  const products = catalog.filter((p) => p.type === 'product');
  const featuredDeals = deals.filter((d) => d.featured).sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || b.reviews - a.reviews).slice(0, 3);
  const best = products.slice().sort((a, b) => Number(b.bestseller) - Number(a.bestseller) || b.reviews - a.reviews).slice(0, 8);
  const fresh = catalog.filter((p) => p.isNew).sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 8);
  const quotes = testimonials.filter((t) => t.active && t.text);
  const { campaign, promoA, promoB } = banners;
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Store', '@id': `${SITE_URL}/#store`, name: 'The Begum Beauty', url: `${SITE_URL}/`, logo: `${SITE_URL}/assets/logo/begum-beauty-logo-horizontal.svg`, description: 'Online makeup and beauty store in Pakistan with makeup deals, free delivery and cash on delivery.', areaServed: 'PK', paymentAccepted: 'Cash', currenciesAccepted: 'PKR' },
      { '@type': 'WebSite', url: `${SITE_URL}/`, name: 'The Begum Beauty', potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/shop?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
    ],
  };

  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    <Hero />

    <section className="section section--band" aria-labelledby="deals-h">
      <div className="container">
        <div className="section-head">
          <div><h2 id="deals-h">Makeup deals under PKR 4,999</h2><p>Every deal brings together the makeup and accessories you need for one low price. See exactly what’s included in each deal.</p></div>
          <Link className="text-link" href="/shop?category=makeup-bundles">View all {deals.length} deals</Link>
        </div>
        <div className="grid-deals">{featuredDeals.map((d) => <DealCard key={d.id} b={d} />)}</div>
      </div>
    </section>

    <MyoFeature />

    <section className="section" aria-labelledby="cats-h">
      <div className="container">
        <div className="section-head"><div><h2 id="cats-h">Find your favourites</h2><p>Lipstick and foundation online, eye makeup, brushes and everyday beauty essentials.</p></div><Link className="text-link" href="/shop">Shop all makeup</Link></div>
        <div className="cat-grid">
          {categories.map((c) => <Link key={c.id} className="cat-tile" href={`/shop?category=${c.id}`}><div className="cat-tile__media"><img src={c.image} alt="" width={600} height={720} loading="lazy" /></div><h3>{c.name}</h3><p>{c.blurb}</p></Link>)}
        </div>
      </div>
    </section>

    {campaign.active && (
      <section className="section--tight" aria-labelledby="campaign-h">
        <div className="container"><div className="campaign">
          <div className="campaign__copy"><h2 id="campaign-h">{campaign.title}</h2><p>{campaign.text}</p><Link className="btn btn--primary" href={campaign.link}>{campaign.cta}</Link></div>
          <div className="campaign__media"><img src={campaign.image} alt="" loading="lazy" width={1200} height={700} /></div>
        </div></div>
      </section>
    )}

    <section className="section" aria-labelledby="best-h">
      <div className="container">
        <div className="section-head"><div><h2 id="best-h">Bestsellers</h2><p>The products customers reorder most.</p></div><Link className="text-link" href="/shop?collection=bestsellers">Shop all bestsellers</Link></div>
        <MyoBanner link />
        <div className="grid-products">{best.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </div>
    </section>

    {(promoA.active || promoB.active) && (
      <section className="section--tight" aria-label="Seasonal promotions">
        <div className="container promo-duo">
          {([[promoA, '#EADFD3'], [promoB, '#EFE3D7']] as const).filter(([b]) => b.active).map(([b, bg]) => (
            <Link key={b.title} className="promo-card" href={b.link} style={{ background: bg }}>
              <img src={b.image} alt="" loading="lazy" width={1200} height={700} />
              <div className="promo-card__copy"><h3>{b.title}</h3><p>{b.text}</p><span className="text-link">{b.cta}</span></div>
            </Link>
          ))}
        </div>
      </section>
    )}

    {fresh.length > 0 && (
      <section className="section" aria-labelledby="new-h">
        <div className="container"><Rail products={fresh}><Link className="text-link" href="/shop?collection=new">See everything new</Link></Rail></div>
      </section>
    )}

    <section className="section--tight" aria-labelledby="brands-h">
      <div className="container">
        <div className="section-head"><div><h2 id="brands-h">Featured brands</h2></div><Link className="text-link" href="/shop">Shop all brands</Link></div>
        <div className="brands">{brands.map((b) => <Link key={b.id} className="brand-cell" href={`/shop?brand=${b.id}`}><strong>{b.name}</strong><small>{b.note}</small></Link>)}</div>
      </div>
    </section>

    <section className="section" aria-labelledby="trust-h">
      <div className="container">
        <div className="section-head"><div><h2 id="trust-h">Shopping with The Begum Beauty</h2><p>Simple, clear policies on every order.</p></div><Link className="text-link" href="/policies">Read our policies</Link></div>
        <div className="trust">
          {[['bolt', 'Same-Day Delivery in Lahore', 'Orders for Lahore are eligible for same-day delivery.'], ['truck', 'Delivery in 3–5 Days', 'Orders to other cities in Pakistan arrive in 3–5 days.'],
            ['gift', 'Free Delivery Across Pakistan', 'Delivery is free on every order, with no minimum spend.'], ['box', 'Open Parcel Facility', 'Open your parcel on delivery before you accept it.'],
            ['cash', 'Cash on Delivery', 'Pay the rider in cash when your order arrives.'], ['headset', '24/7 Customer Support', 'Questions about products, deals or orders? We’re here to help, day or night.']].map(([icon, h, p]) => (
            <div className="trust__item" key={h}><span className="trust__icon"><Icon name={icon} /></span><h3>{h}</h3><p>{p}</p></div>
          ))}
        </div>
      </div>
    </section>

    {quotes.length > 0 && (
      <section className="section section--band" aria-labelledby="quotes-h">
        <div className="container">
          <div className="section-head"><div><h2 id="quotes-h">What customers say</h2><p>Reviews from The Begum Beauty customers across Pakistan.</p></div></div>
          <div className="quotes">
            {quotes.map((t) => { const r = Math.max(1, Math.min(5, Math.round(t.rating))); return (
              <figure className="quote" key={t.id}>
                <Stars rating={r} />
                <blockquote>“{t.text}”</blockquote>
                <figcaption><span className="quote__who">{t.image ? <img className="quote__avatar" src={t.image} alt="" loading="lazy" width={48} height={48} /> : <span className="quote__avatar" aria-hidden="true">{(t.name || '?').trim().charAt(0).toUpperCase()}</span>}
                  <span><strong>{t.name}</strong>{t.city && <small>{t.city}</small>}</span></span>
                  {t.sample && <span className="badge badge--muted">Sample review</span>}</figcaption>
              </figure>); })}
          </div>
        </div>
      </section>
    )}
  </>);
}
