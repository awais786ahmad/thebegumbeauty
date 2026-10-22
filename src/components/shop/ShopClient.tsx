'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import { MyoBanner } from '@/components/store/Myo';
import { ProductCard } from '@/components/store/ProductCard';
import { useStore } from '@/components/store/StoreProvider';
import { discountPct, fmt } from '@/lib/format';
import type { Product } from '@/lib/types';

const PAGE = 9;
const RANGES = [
  { id: 'u1000', label: 'Under PKR 1,000', min: 0, max: 999 },
  { id: '1000-2500', label: 'PKR 1,000–2,500', min: 1000, max: 2500 },
  { id: '2500-4000', label: 'PKR 2,500–4,000', min: 2500, max: 4000 },
  { id: '4000-5000', label: 'PKR 4,000–5,000', min: 4000, max: 5000 },
  { id: 'o5000', label: 'Above PKR 5,000', min: 5001, max: Infinity },
];
const FAMILIES = [
  { id: 'nude', label: 'Nude and beige', hex: '#E2BE9E' }, { id: 'brown', label: 'Brown', hex: '#8A5A3C' },
  { id: 'pink', label: 'Pink', hex: '#D4848F' }, { id: 'red', label: 'Red and berry', hex: '#8E2F45' }, { id: 'black', label: 'Black', hex: '#211A1C' },
];
const SORTS: Record<string, { label: string; fn: (a: Product, b: Product) => number }> = {
  featured: { label: 'Recommended', fn: (a, b) => Number(b.featured) - Number(a.featured) || b.reviews - a.reviews },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  newest: { label: 'Newest arrivals', fn: (a, b) => b.addedAt.localeCompare(a.addedAt) },
  bestsellers: { label: 'Bestsellers', fn: (a, b) => Number(b.bestseller) - Number(a.bestseller) || b.reviews - a.reviews },
  rating: { label: 'Highest rated', fn: (a, b) => b.rating - a.rating || b.reviews - a.reviews },
};
function family(hex: string) {
  const h = hex.replace('#', ''); const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2; let hue = 0;
  if (max !== min) { const d = max - min; hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; hue = (hue * 60 + 360) % 360; }
  if (l < 0.2) return 'black';
  if (hue >= 20 && hue <= 55) return l > 0.62 ? 'nude' : 'brown';
  return l >= 0.58 ? 'pink' : 'red';
}

export type ShopParams = { category?: string; brand?: string; collection?: string; q?: string; type?: string; sort?: string };

type State = {
  q: string; min: string; max: string; range: string; cats: Set<string>; brands: Set<string>; types: Set<string>;
  discount: number; inStock: boolean; rating: number; shades: Set<string>; collection: string; singles: boolean; sort: string; shown: number;
};
const init = (p: ShopParams): State => ({
  q: p.q ?? '', min: '', max: '', range: '', cats: new Set(p.category ? [p.category] : []), brands: new Set(p.brand ? [p.brand] : []), types: new Set(),
  discount: 0, inStock: false, rating: 0, shades: new Set(), collection: p.collection ?? '', singles: p.type === 'products',
  sort: p.sort && SORTS[p.sort] ? p.sort : p.collection === 'new' ? 'newest' : p.collection === 'bestsellers' ? 'bestsellers' : 'featured', shown: PAGE,
});

export default function ShopClient({ params, heading, intro }: { params: ShopParams; heading: string; intro: string }) {
  const { catalog: all, categories, brands, brandName, catName } = useStore();
  const [s, setS] = useState<State>(() => init(params));
  const [search, setSearch] = useState(params.q ?? '');
  const key = JSON.stringify(params);
  const lastKey = useRef(key);
  useEffect(() => { if (lastKey.current !== key) { lastKey.current = key; setS(init(params)); setSearch(params.q ?? ''); } }, [key, params]);
  const [panelOpen, setPanelOpen] = useState(false);
  const up = (patch: Partial<State>) => setS((x) => ({ ...x, shown: PAGE, ...patch }));
  const toggle = (k: 'cats' | 'brands' | 'types' | 'shades', v: string) => setS((x) => { const n = new Set(x[k]); if (n.has(v)) n.delete(v); else n.add(v); return { ...x, [k]: n, shown: PAGE }; });

  const types = useMemo(() => [...new Set(all.map((p) => p.productType))].sort(), [all]);
  const fams = useMemo(() => { const f = new Set<string>(); all.forEach((p) => p.shades.forEach((x) => f.add(family(x.hex)))); return f; }, [all]);
  const count = (fn: (p: Product) => boolean) => all.filter(fn).length;

  const list = useMemo(() => {
    const min = s.min === '' ? 0 : +s.min, max = s.max === '' ? Infinity : +s.max;
    const range = RANGES.find((r) => r.id === s.range);
    const words = s.q.toLowerCase().split(/\s+/).filter(Boolean);
    return all.filter((p) => {
      if (words.length) { const hay = `${p.name} ${brandName(p.brand)} ${catName(p.category)} ${p.productType}`.toLowerCase(); if (!words.every((w) => hay.includes(w))) return false; }
      if (s.singles && p.type !== 'product') return false;
      if (s.collection === 'new' && !p.isNew) return false;
      if (s.collection === 'bestsellers' && !p.bestseller) return false;
      if (p.price < min || p.price > max) return false;
      if (range && (p.price < range.min || p.price > range.max)) return false;
      if (s.cats.size && !s.cats.has(p.category)) return false;
      if (s.brands.size && !s.brands.has(p.brand)) return false;
      if (s.types.size && !s.types.has(p.productType)) return false;
      if (s.discount && discountPct(p) < s.discount) return false;
      if (s.inStock && p.stock <= 0) return false;
      if (s.rating && p.rating < s.rating) return false;
      if (s.shades.size && !p.shades.some((x) => s.shades.has(family(x.hex)))) return false;
      return true;
    }).sort(SORTS[s.sort].fn);
  }, [all, s, brandName, catName]);
  const shown = list.slice(0, s.shown);

  const chips: [string, string, string][] = [];
  if (s.q) chips.push(['q', '', `Search: ${s.q}`]);
  if (s.singles) chips.push(['singles', '', 'Single products']);
  if (s.collection) chips.push(['collection', '', s.collection === 'new' ? 'New arrivals' : 'Bestsellers']);
  if (s.min !== '') chips.push(['min', '', `Min ${fmt(+s.min)}`]);
  if (s.max !== '') chips.push(['max', '', `Max ${fmt(+s.max)}`]);
  if (s.range) chips.push(['range', '', RANGES.find((r) => r.id === s.range)!.label]);
  s.cats.forEach((v) => chips.push(['cats', v, catName(v)]));
  s.brands.forEach((v) => chips.push(['brands', v, brandName(v)]));
  s.types.forEach((v) => chips.push(['types', v, v]));
  if (s.discount) chips.push(['discount', '', `${s.discount}% off or more`]);
  if (s.inStock) chips.push(['inStock', '', 'In stock']);
  if (s.rating) chips.push(['rating', '', `Rated ${s.rating}+`]);
  s.shades.forEach((v) => chips.push(['shades', v, FAMILIES.find((f) => f.id === v)!.label]));
  const removeChip = (k: string, v: string) => {
    if (k === 'cats' || k === 'brands' || k === 'types' || k === 'shades') return toggle(k, v);
    if (k === 'q') { setSearch(''); return up({ q: '' }); }
    up({ [k]: k === 'discount' || k === 'rating' ? 0 : k === 'inStock' || k === 'singles' ? false : '' } as Partial<State>);
  };
  const clearAll = () => { setSearch(''); setS((x) => ({ ...init({}), sort: x.sort })); };

  return (<>
    <div className="page-head">
      <nav aria-label="Breadcrumb"><ol className="crumbs"><li><Link href="/">Home</Link></li><li aria-current="page">{heading}</li></ol></nav>
      <h1>{heading}</h1>
      <p>{intro}</p>
    </div>
    <div className="shop">
      {panelOpen && <div className="scrim is-open" onClick={() => setPanelOpen(false)} />}
      <aside className={`filters${panelOpen ? ' is-open' : ''}`} id="filters" aria-label="Product filters">
        <div className="filters__mobile-head"><h2>Filters</h2><button className="icon-btn" type="button" aria-label="Close filters" onClick={() => setPanelOpen(false)}><Icon name="close" /></button></div>
        <div>
          <div className="filter-group"><h3>Price</h3>
            <div className="price-inputs">
              <div className="field"><label className="visually-hidden" htmlFor="f-min">Minimum price</label><input className="input" id="f-min" type="number" inputMode="numeric" min={0} step={50} placeholder="Min PKR" value={s.min} onChange={(e) => up({ min: e.target.value === '' ? '' : String(Math.max(0, +e.target.value)), range: '' })} /></div>
              <div className="field"><label className="visually-hidden" htmlFor="f-max">Maximum price</label><input className="input" id="f-max" type="number" inputMode="numeric" min={0} step={50} placeholder="Max PKR" value={s.max} onChange={(e) => up({ max: e.target.value === '' ? '' : String(Math.max(0, +e.target.value)), range: '' })} /></div>
            </div>
            {RANGES.map((r) => <label className="check" key={r.id}><input type="radio" name="f-range" checked={s.range === r.id} onChange={() => up({ range: r.id, min: '', max: '' })} /> {r.label}<small>{count((p) => p.price >= r.min && p.price <= r.max)}</small></label>)}
          </div>
          <div className="filter-group"><h3>Category</h3>{categories.map((c) => <label className="check" key={c.id}><input type="checkbox" checked={s.cats.has(c.id)} onChange={() => toggle('cats', c.id)} /> {c.name}<small>{count((p) => p.category === c.id)}</small></label>)}</div>
          <div className="filter-group"><h3>Brand</h3>{brands.map((b) => <label className="check" key={b.id}><input type="checkbox" checked={s.brands.has(b.id)} onChange={() => toggle('brands', b.id)} /> {b.name}<small>{count((p) => p.brand === b.id)}</small></label>)}</div>
          <div className="filter-group"><h3>Product type</h3>{types.map((t) => <label className="check" key={t}><input type="checkbox" checked={s.types.has(t)} onChange={() => toggle('types', t)} /> {t}<small>{count((p) => p.productType === t)}</small></label>)}</div>
          <div className="filter-group"><h3>Discount</h3>{[0, 10, 15, 20].map((d) => <label className="check" key={d}><input type="radio" name="f-disc" checked={s.discount === d} onChange={() => up({ discount: d })} /> {d ? `${d}% off or more` : 'Any'}</label>)}</div>
          <div className="filter-group"><h3>Availability</h3><label className="check"><input type="checkbox" checked={s.inStock} onChange={(e) => up({ inStock: e.target.checked })} /> In stock only<small>{count((p) => p.stock > 0)}</small></label></div>
          <div className="filter-group"><h3>Customer rating</h3>{[0, 4.5, 4].map((r) => <label className="check" key={r}><input type="radio" name="f-rating" checked={s.rating === r} onChange={() => up({ rating: r })} /> {r ? `${r} and above` : 'Any'}</label>)}</div>
          {fams.size > 0 && <div className="filter-group"><h3>Shade</h3><div className="shade-filter">{FAMILIES.filter((f) => fams.has(f.id)).map((f) => <label key={f.id} title={f.label}><input type="checkbox" checked={s.shades.has(f.id)} onChange={() => toggle('shades', f.id)} /><span style={{ background: f.hex }} /><span className="visually-hidden">{f.label}</span></label>)}</div></div>}
        </div>
        <div className="filters__apply"><button className="btn btn--primary btn--block" type="button" onClick={() => setPanelOpen(false)}>Show {list.length} products</button></div>
      </aside>
      <div>
        {params.category !== 'makeup-bundles' && <MyoBanner link={!s.singles} />}
        <div className="toolbar">
          <button className="btn btn--secondary btn--sm filters-toggle" type="button" aria-controls="filters" onClick={() => setPanelOpen(true)}><Icon name="filter" className="icon--sm" />Filters {chips.length ? `(${chips.length})` : ''}</button>
          <form role="search" style={{ flex: 1, maxWidth: 360, minWidth: 200 }} onSubmit={(e) => { e.preventDefault(); up({ q: search.trim() }); }}>
            <label className="visually-hidden" htmlFor="shop-q">Search within products</label>
            <input className="input" id="shop-q" type="search" placeholder="Search by product, brand or type" value={search} onChange={(e) => { setSearch(e.target.value); if (!e.target.value) up({ q: '' }); }} />
          </form>
          <div className="toolbar__right"><span className="toolbar__count" aria-live="polite">{list.length} {list.length === 1 ? 'product' : 'products'}</span>
            <label className="visually-hidden" htmlFor="sort">Sort products</label>
            <select className="select" id="sort" value={s.sort} onChange={(e) => setS((x) => ({ ...x, sort: e.target.value }))}>{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          </div>
        </div>
        <div className="chips" aria-label="Active filters">
          {chips.map(([k, v, l]) => <span className="chip" key={k + v}>{l}<button type="button" aria-label={`Remove filter: ${l}`} onClick={() => removeChip(k, v)}>×</button></span>)}
          {chips.length > 0 && <button className="link-btn" type="button" onClick={clearAll}>Clear all filters</button>}
        </div>
        <div className="grid-products grid-products--shop">
          {list.length ? shown.map((p) => <ProductCard key={p.id} p={p} />) : (
            <div className="empty" style={{ gridColumn: '1/-1' }}><svg viewBox="0 0 64 64" aria-hidden="true"><use href="#hm-icon" /></svg><h2>No products match these filters</h2><p>Try removing a filter or widening the price range.</p><button className="btn btn--primary" type="button" onClick={clearAll}>Clear all filters</button></div>
          )}
        </div>
        {list.length > PAGE && (
          <div className="load-more"><span>Showing {shown.length} of {list.length}</span><div className="progress" aria-hidden="true"><span style={{ width: `${(shown.length / list.length) * 100}%` }} /></div>
            {shown.length < list.length && <button className="btn btn--secondary" type="button" onClick={() => setS((x) => ({ ...x, shown: x.shown + PAGE }))}>Load more</button>}</div>
        )}
      </div>
    </div>
  </>);
}
