'use client';
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { errorMessage } from '@/lib/admin/errors';
import { BANNER_KEYS, fetchBanners, fetchCategories, fetchProducts, fetchSetting, patchProduct, refreshStore, saveBanners, saveSetting } from '@/lib/admin/db';
import { useLoad } from '@/lib/admin/useLoad';
import { discountPct, fmt } from '@/lib/format';
import type { Banner, BannerKey, Banners, MyoSettings, Product } from '@/lib/types';
import { useToast } from './Toast';
import { Loading, LoadError, Thumb, UploadButton } from './ui';

const BANNER_LABELS: Record<BannerKey, string> = { campaign: 'Main campaign', promoA: 'Promotion one', promoB: 'Promotion two' };
const DISCOUNTS = [5, 10, 15, 20, 25, 30, 40, 50];

export default function PromotionsView({ defaultMyo, defaultBanners }: { defaultMyo: MyoSettings; defaultBanners: Banners }) {
  const toast = useToast();
  const load = useMemo(() => async () => {
    const [myo, banners, products, categories] = await Promise.all([
      fetchSetting<MyoSettings>('myo', defaultMyo), fetchBanners(defaultBanners), fetchProducts(), fetchCategories(),
    ]);
    return { myo, banners, products, categories };
  }, [defaultMyo, defaultBanners]);
  const { data, setData, error, loading, reload } = useLoad(load);

  if (loading && !data) return <Loading label="Loading promotions…" />;
  if (error || !data) return <LoadError error={error ?? 'Could not load promotions.'} onRetry={reload} />;

  const setProducts = (fn: (list: Product[]) => Product[]) => setData((d) => d && { ...d, products: fn(d.products) });

  async function toggleFeatured(p: Product, featured: boolean) {
    setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, featured } : x)));
    try {
      await patchProduct(p.id, { featured });
      void refreshStore();
      toast(`${p.name} ${featured ? 'is now featured' : 'is no longer featured'}`);
    } catch (e) {
      setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, featured: !featured } : x)));
      toast(errorMessage(e), { error: true });
    }
  }

  return (
    <>
      <MyoPanel initial={data.myo} onSaved={(myo) => setData((d) => d && { ...d, myo })} />
      <BannersPanel initial={data.banners} />

      <section className="panel">
        <div className="panel__head"><h2>Bundle promotions</h2></div>
        <BundleTable products={data.products} onToggle={toggleFeatured} />
      </section>

      <DiscountPanel products={data.products} categories={data.categories} onApplied={setProducts} />

      <section className="panel">
        <div className="panel__head"><h2>Featured products</h2></div>
        <p className="adm-muted" style={{ marginBottom: 12 }}>Products marked Featured are ranked first under “Recommended” in the shop. Use the Bestseller and New arrival labels in each product to control the homepage sections.</p>
        <div className="toggles">
          {data.products.filter((p) => p.type === 'product').map((p) => (
            <label className="check" key={p.id}>
              <input type="checkbox" checked={p.featured} onChange={(e) => void toggleFeatured(p, e.target.checked)} /> {p.name}
              {p.status === 'draft' && <small style={{ marginLeft: 0 }}>(draft)</small>}
            </label>
          ))}
        </div>
      </section>
    </>
  );
}

function MyoPanel({ initial, onSaved }: { initial: MyoSettings; onSaved: (m: MyoSettings) => void }) {
  const toast = useToast();
  const [active, setActive] = useState(initial.active);
  const [percent, setPercent] = useState(String(initial.percent));
  const [min, setMin] = useState(String(initial.min));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  async function save() {
    const p = Math.round(Number(percent)), m = Math.round(Number(min));
    if (!(p >= 1 && p <= 90) || !(m >= 2 && m <= 10)) { toast('Use a discount between 1 and 90% and a minimum of 2 to 10 products.', { error: true }); return; }
    setSaving(true); setSaved('');
    try {
      const value = { active, percent: p, min: m };
      await saveSetting('myo', value);
      onSaved(value);
      void refreshStore();
      setSaved('Saved. The offer is updated across the store.');
      toast('Make Your Own Deal saved');
    } catch (e) { toast(errorMessage(e), { error: true }); }
    finally { setSaving(false); }
  }

  return (
    <section className="panel">
      <div className="panel__head"><h2>Make Your Own Deal</h2><span className="saved" aria-live="polite">{saved}</span></div>
      <p className="adm-muted" style={{ marginBottom: 14 }}>Customers who add the minimum number of single products to their bag get this discount on those products automatically. Makeup bundles are not included.</p>
      <div className="grid-3" style={{ alignItems: 'end' }}>
        <div className="field"><label htmlFor="myo-pct">Discount (%)</label><input className="input" id="myo-pct" type="number" min={1} max={90} step={1} value={percent} onChange={(e) => setPercent(e.target.value)} /></div>
        <div className="field"><label htmlFor="myo-min">Minimum single products</label><input className="input" id="myo-min" type="number" min={2} max={10} step={1} value={min} onChange={(e) => setMin(e.target.value)} /></div>
        <label className="check" style={{ paddingBottom: 12 }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Offer is active</label>
      </div>
      <div style={{ marginTop: 16 }}><button className="btn btn--primary" type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save offer'}</button></div>
    </section>
  );
}

function BannersPanel({ initial }: { initial: Banners }) {
  const toast = useToast();
  const [banners, setBanners] = useState<Banners>(initial);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [saved, setSaved] = useState('');
  const set = (k: BannerKey, patch: Partial<Banner>) => { setBanners((b) => ({ ...b, [k]: { ...b[k], ...patch } })); setSaved(''); };

  async function save() {
    setSaving(true);
    try {
      await saveBanners(banners);
      void refreshStore();
      setSaved('Saved. The homepage now shows these banners.');
      toast('Banners saved');
    } catch (e) { toast(errorMessage(e), { error: true }); }
    finally { setSaving(false); }
  }

  return (
    <section className="panel">
      <div className="panel__head"><h2>Homepage banners</h2><span className="saved" aria-live="polite">{saved}</span></div>
      <div className="cards-3">
        {BANNER_KEYS.map((k) => {
          const b = banners[k];
          return (
            <article className="mcard" key={k}>
              {b.image ? <img src={b.image} alt="" /> : <div className="adm-card-ph" aria-hidden="true"><Icon name="gift" /></div>}
              <div className="mcard__body">
                <h3>{BANNER_LABELS[k]}</h3>
                <div className="field"><label htmlFor={`bn-${k}-t`}>Title</label><input className="input" id={`bn-${k}-t`} value={b.title} onChange={(e) => set(k, { title: e.target.value })} /></div>
                <div className="field"><label htmlFor={`bn-${k}-x`}>Text</label><textarea className="textarea" id={`bn-${k}-x`} style={{ minHeight: 72 }} value={b.text} onChange={(e) => set(k, { text: e.target.value })} /></div>
                <div className="grid-2">
                  <div className="field"><label htmlFor={`bn-${k}-c`}>Button label</label><input className="input" id={`bn-${k}-c`} value={b.cta} onChange={(e) => set(k, { cta: e.target.value })} /></div>
                  <div className="field"><label htmlFor={`bn-${k}-l`}>Link</label><input className="input" id={`bn-${k}-l`} value={b.link} placeholder="/shop" onChange={(e) => set(k, { link: e.target.value })} /></div>
                </div>
                <div className="tools">
                  <label className="check"><input type="checkbox" checked={b.active} onChange={(e) => set(k, { active: e.target.checked })} /> Show on homepage</label>
                  <UploadButton folder="banners" label="Image" ariaLabel={`Image for ${BANNER_LABELS[k]}`} onBusy={(x) => setUploads((n) => Math.max(0, n + (x ? 1 : -1)))} onUploaded={(url) => set(k, { image: url })} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div className="adm-savebar">
        <button className="btn btn--primary" type="button" onClick={save} disabled={saving || uploads > 0}>{saving ? 'Saving…' : 'Save banners'}</button>
        <a className="btn btn--secondary" href="/" target="_blank" rel="noopener">Preview homepage</a>
      </div>
    </section>
  );
}

function BundleTable({ products, onToggle }: { products: Product[]; onToggle: (p: Product, v: boolean) => void }) {
  const bundles = products.filter((p) => p.type === 'bundle');
  if (!bundles.length) return <p className="adm-muted">No bundles yet. Add bundles under Makeup bundles.</p>;
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead><tr><th>Bundle</th><th>Items</th><th>Bundle price</th><th>On homepage deals</th></tr></thead>
        <tbody>
          {bundles.map((p) => (
            <tr key={p.id}>
              <td><div className="name"><Thumb src={p.images[0]} /><span><strong>{p.name}</strong>{p.status === 'draft' && <small>Draft</small>}</span></div></td>
              <td style={{ whiteSpace: 'normal', minWidth: 200 }}>{p.items.map((x) => x.name).join(', ') || '—'}</td>
              <td>{fmt(p.price)}</td>
              <td><label className="check"><input type="checkbox" checked={p.featured} onChange={(e) => onToggle(p, e.target.checked)} /> Featured</label></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DiscountPanel({ products, categories, onApplied }: { products: Product[]; categories: { id: string; name: string }[]; onApplied: (fn: (l: Product[]) => Product[]) => void }) {
  const toast = useToast();
  const cats = categories.filter((c) => products.some((p) => p.type === 'product' && p.category === c.id));
  const [cat, setCat] = useState(cats[0]?.id ?? '');
  const [pct, setPct] = useState(10);
  const [busy, setBusy] = useState(false);
  const discounted = products.filter((p) => p.type === 'product' && discountPct(p));
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  async function apply(remove: boolean) {
    const targets = products.filter((p) => p.type === 'product' && p.category === cat);
    if (!targets.length) { toast('That category has no single products.', { error: true }); return; }
    const msg = remove
      ? `Remove the discount from ${targets.length} products in ${catName(cat)}? Their price goes back to the original price.`
      : `Apply ${pct}% off to ${targets.length} products in ${catName(cat)}? Prices are rounded to the nearest PKR 10.`;
    if (!confirm(msg)) return;
    const changes = targets.map((p) => {
      const base = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price;
      return remove
        ? { id: p.id, price: base, originalPrice: null as number | null }
        : { id: p.id, price: Math.round((base * (1 - pct / 100)) / 10) * 10, originalPrice: base as number | null };
    });
    setBusy(true);
    const results = await Promise.allSettled(changes.map((c) => patchProduct(c.id, { price: c.price, original_price: c.originalPrice })));
    const ok = new Set(changes.filter((_, i) => results[i].status === 'fulfilled').map((c) => c.id));
    const byId = new Map(changes.map((c) => [c.id, c]));
    onApplied((l) => l.map((p) => (ok.has(p.id) ? { ...p, price: byId.get(p.id)!.price, originalPrice: byId.get(p.id)!.originalPrice } : p)));
    setBusy(false);
    if (ok.size) void refreshStore();
    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed) toast(`Updated ${ok.size} of ${changes.length} products. ${errorMessage(failed.reason)}`, { error: true });
    else toast(`${remove ? 'Removed discount from' : `Applied ${pct}% off to`} ${ok.size} products in ${catName(cat)}`);
  }

  return (
    <section className="panel">
      <div className="panel__head"><h2>Discount management</h2></div>
      {cats.length ? (
        <div className="tools" style={{ marginBottom: 16 }}>
          <label htmlFor="dc-cat" className="label">Category</label>
          <select className="select" id="dc-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="visually-hidden" htmlFor="dc-pct">Discount percentage</label>
          <select className="select" id="dc-pct" value={pct} onChange={(e) => setPct(Number(e.target.value))}>
            {DISCOUNTS.map((v) => <option key={v} value={v}>{v}% off</option>)}
          </select>
          <button className="btn btn--primary btn--sm" type="button" disabled={busy || !cat} onClick={() => void apply(false)}>{busy ? 'Working…' : 'Apply discount'}</button>
          <button className="btn btn--secondary btn--sm" type="button" disabled={busy || !cat} onClick={() => void apply(true)}>Remove discount</button>
        </div>
      ) : <p className="adm-muted" style={{ marginBottom: 16 }}>Add single products to a category to use category discounts.</p>}
      <div className="table-wrap">
        <table className="tbl">
          <thead><tr><th>Product</th><th>Category</th><th>Original</th><th>Selling price</th><th>Discount</th></tr></thead>
          <tbody>
            {discounted.length ? discounted.map((p) => (
              <tr key={p.id}><td>{p.name}</td><td>{catName(p.category)}</td><td>{fmt(p.originalPrice ?? 0)}</td><td>{fmt(p.price)}</td><td>{discountPct(p)}%</td></tr>
            )) : <tr><td colSpan={5}>No discounted products.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
