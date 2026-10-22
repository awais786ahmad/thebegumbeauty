'use client';
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { errorMessage } from '@/lib/admin/errors';
import { deleteProduct, insertProduct, refreshStore, updateProduct } from '@/lib/admin/db';
import { discountPct, fmt, productHref, slugify } from '@/lib/format';
import type { Brand, BundleItem, Category, Product, Shade } from '@/lib/types';
import Drawer from './Drawer';
import { useToast } from './Toast';
import { ImageList, ItemThumb, UploadButton } from './ui';

type Kind = Product['type'];
type SpecRow = { key: string; value: string };

type Props = {
  type: Kind;
  product: Product | null; // null = new
  categories: Category[];
  brands: Brand[];
  takenIds: Set<string>;
  onClose: () => void;
  onSaved: (p: Product, isNew: boolean) => void;
  onDeleted: (id: string) => void;
};

const DEAL_CAP = 4999;
const today = () => new Date().toISOString().slice(0, 10);
const num = (s: string) => (s.trim() === '' ? NaN : Number(s));

function blankProduct(type: Kind, categories: Category[], brands: Brand[]): Product {
  const cat = type === 'bundle' ? categories.find((c) => c.id === 'makeup-bundles') ?? categories[0] : categories.find((c) => c.id !== 'makeup-bundles') ?? categories[0];
  return {
    id: '', type, name: '', brand: brands.find((b) => b.id === 'studio')?.id ?? brands[0]?.id ?? '', category: cat?.id ?? '',
    productType: type === 'bundle' ? 'Makeup bundle' : '', kind: type, price: 0, originalPrice: null, stock: 0, rating: 0, reviews: 0,
    addedAt: today(), bestseller: false, isNew: true, featured: false, status: 'draft', description: '', features: [], specs: {}, usage: '',
    images: [], shades: [], items: [], tone: 'blush', sku: '',
  };
}

export default function ProductEditor({ type, product, categories, brands, takenIds, onClose, onSaved, onDeleted }: Props) {
  const toast = useToast();
  const isNew = !product;
  const base = useMemo(() => product ?? blankProduct(type, categories, brands), [product, type, categories, brands]);
  const noun = type === 'bundle' ? 'bundle' : 'product';

  const [name, setName] = useState(base.name);
  const [description, setDescription] = useState(base.description);
  const [usage, setUsage] = useState(base.usage);
  const [brand, setBrand] = useState(base.brand);
  const [category, setCategory] = useState(base.category);
  const [productType, setProductType] = useState(base.productType);
  const [sku, setSku] = useState(base.sku);
  const [price, setPrice] = useState(base.price ? String(base.price) : '');
  const [orig, setOrig] = useState(base.originalPrice ? String(base.originalPrice) : '');
  const [stock, setStock] = useState(String(base.stock ?? 0));
  const [featured, setFeatured] = useState(base.featured);
  const [bestseller, setBestseller] = useState(base.bestseller);
  const [isNewArrival, setIsNewArrival] = useState(base.isNew);
  const [status, setStatus] = useState<Product['status']>(base.status);
  const [images, setImages] = useState<string[]>(base.images);
  const [shades, setShades] = useState<Shade[]>(base.shades.map((s) => ({ ...s })));
  const [items, setItems] = useState<BundleItem[]>(base.items.map((x) => ({ name: x.name, image: x.image ?? '' })));
  const [features, setFeatures] = useState(base.features.join('\n'));
  const [specs, setSpecs] = useState<SpecRow[]>(Object.entries(base.specs).filter(([k]) => !(type === 'bundle' && k === 'Items')).map(([key, value]) => ({ key, value: String(value) })));
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploads, setUploads] = useState(0);
  const busy = saving || deleting || uploads > 0;
  const trackUpload = (b: boolean) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)));

  const priceN = num(price);
  const origN = num(orig);
  const namedItems = items.filter((x) => x.name.trim()).length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    const errs: string[] = [];
    if (!n) errs.push('Add a name.');
    if (!Number.isFinite(priceN) || priceN <= 0) errs.push(`Add a ${type === 'bundle' ? 'bundle' : 'selling'} price above zero.`);
    if (type === 'product' && orig.trim() && (!Number.isFinite(origN) || origN < 0)) errs.push('The original price must be a positive number, or left empty.');
    const stockN = stock.trim() === '' ? 0 : Number(stock);
    if (!Number.isFinite(stockN) || stockN < 0) errs.push('Stock must be zero or more.');
    if (!images.length) errs.push('Upload at least one image.');
    if (type === 'bundle' && namedItems < 2) errs.push('Add at least two items to the bundle.');
    if (!category) errs.push('Choose a category.');
    setErrors(errs);
    if (errs.length) return;

    let id = base.id;
    if (isNew) {
      const root = slugify(n) || noun;
      id = root;
      for (let i = 2; takenIds.has(id); i++) id = `${root}-${i}`;
    }
    const cleanItems = items.filter((x) => x.name.trim()).map((x) => ({ name: x.name.trim(), image: x.image }));
    const specObj: Record<string, string> = {};
    for (const r of specs) if (r.key.trim() && r.value.trim()) specObj[r.key.trim()] = r.value.trim();
    if (type === 'bundle') specObj.Items = String(cleanItems.length);

    const next: Product = {
      ...base,
      id,
      name: n,
      description: description.trim(),
      usage: usage.trim(),
      brand,
      category,
      productType: productType.trim() || (type === 'bundle' ? 'Makeup bundle' : 'Makeup'),
      sku: sku.trim() || base.sku || `TBB-${id.replace(/-/g, '').slice(0, 4).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      price: Math.round(priceN),
      originalPrice: type === 'bundle' || !Number.isFinite(origN) || origN <= 0 ? null : Math.round(origN),
      stock: Math.round(stockN),
      featured, bestseller, isNew: isNewArrival, status,
      images,
      shades: type === 'bundle' ? [] : shades.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), hex: s.hex })),
      items: type === 'bundle' ? cleanItems : [],
      features: features.split('\n').map((s) => s.trim()).filter(Boolean),
      specs: specObj,
    };

    setSaving(true);
    try {
      const saved = isNew ? await insertProduct(next) : await updateProduct(next);
      void refreshStore();
      onSaved(saved, isNew);
      toast(`${isNew ? 'Created' : 'Saved'} ${saved.name}`, saved.status === 'published' ? { link: { href: productHref(saved.id), label: 'View in store' } } : undefined);
    } catch (err) {
      setErrors([errorMessage(err)]);
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!product || !confirm(`Delete ${product.name}? This cannot be undone. Past orders keep their line items.`)) return;
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      void refreshStore();
      onDeleted(product.id);
      toast(`Deleted ${product.name}`);
    } catch (err) {
      setErrors([errorMessage(err)]);
      setDeleting(false);
    }
  }

  const footer = (
    <>
      <button className="btn btn--primary" type="submit" form="ed-form" disabled={busy}>
        {saving ? 'Saving…' : uploads ? 'Uploading…' : isNew ? `Create ${noun}` : 'Save changes'}
      </button>
      {!isNew && <button className="btn btn--secondary" type="button" onClick={onDelete} disabled={busy}>{deleting ? 'Deleting…' : 'Delete'}</button>}
    </>
  );

  return (
    <Drawer title={isNew ? `Add ${noun}` : `Edit ${base.name}`} onClose={onClose} footer={footer}>
      <form id="ed-form" noValidate onSubmit={onSubmit}>
        <p className={`form-alert${errors.length ? ' is-on' : ''}`} role="alert">{errors.join(' ')}</p>

        <fieldset>
          <legend>Images</legend>
          <ImageList images={images} onChange={setImages} folder="products" onBusy={trackUpload} />
          <p className="adm-hint">The first image is the main {noun} image. JPG, PNG, WebP or AVIF up to 5 MB.</p>
        </fieldset>

        <fieldset>
          <legend>Details</legend>
          <div className="field"><label htmlFor="ed-name">Name</label><input className="input" id="ed-name" required value={name} onChange={(e) => setName(e.target.value)} data-autofocus /></div>
          {isNew && name.trim() && <p className="adm-hint">Web address: /product/{slugify(name) || noun}</p>}
          <div className="field"><label htmlFor="ed-desc">Description</label><textarea className="textarea" id="ed-desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="ed-brand">Brand</label>
              <select className="select" id="ed-brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">No brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ed-cat">Category</label>
              <select className="select" id="ed-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                {!category && <option value="">Choose a category</option>}
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="ed-type">Product type</label><input className="input" id="ed-type" value={productType} onChange={(e) => setProductType(e.target.value)} placeholder={type === 'bundle' ? 'Makeup bundle' : 'Lipstick, Foundation…'} /></div>
            <div className="field"><label htmlFor="ed-sku">SKU</label><input className="input" id="ed-sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Generated if left empty" /></div>
          </div>
        </fieldset>

        {type === 'bundle' && (
          <fieldset>
            <legend>Items in this bundle</legend>
            <p className="adm-hint">Type each item in the bundle. Items don’t have their own prices: customers pay the one bundle price below.</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {items.length ? items.map((x, i) => (
                <div className="item-row" key={i}>
                  <ItemThumb image={x.image} />
                  <UploadButton folder="products" label="Photo" ariaLabel={`Photo for item ${i + 1}`} onBusy={trackUpload}
                    onUploaded={(url) => setItems((all) => all.map((it, j) => (j === i ? { ...it, image: url } : it)))} />
                  <input className="input" value={x.name} placeholder="Item name, for example Velvet Matte Lipstick" aria-label={`Item ${i + 1} name`}
                    onChange={(e) => setItems((all) => all.map((it, j) => (j === i ? { ...it, name: e.target.value } : it)))} />
                  <button type="button" className="link-btn" onClick={() => setItems((all) => all.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`}>Remove</button>
                </div>
              )) : <p className="adm-muted">No items yet. Add the products that come in this bundle.</p>}
            </div>
            <button type="button" className="btn btn--secondary btn--sm" style={{ justifySelf: 'start' }} onClick={() => setItems((all) => [...all, { name: '', image: '' }])}>
              <Icon name="plus" className="icon--sm" />Add item
            </button>
          </fieldset>
        )}

        <fieldset>
          <legend>Pricing and stock</legend>
          <div className={type === 'bundle' ? 'grid-2' : 'grid-3'}>
            <div className="field"><label htmlFor="ed-price">{type === 'bundle' ? 'Bundle price (PKR)' : 'Selling price (PKR)'}</label><input className="input" id="ed-price" type="number" inputMode="numeric" min={0} step={1} required value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            {type === 'product' && <div className="field"><label htmlFor="ed-orig">Original price (PKR)</label><input className="input" id="ed-orig" type="number" inputMode="numeric" min={0} step={1} value={orig} onChange={(e) => setOrig(e.target.value)} placeholder="Optional" /></div>}
            <div className="field"><label htmlFor="ed-stock">Stock quantity</label><input className="input" id="ed-stock" type="number" inputMode="numeric" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} /></div>
          </div>
          <div className="calc" aria-live="polite">
            {type === 'bundle' ? (
              <>
                <div><span>{namedItems} {namedItems === 1 ? 'item' : 'items'} in this bundle</span><span>One price</span></div>
                <div><span>Customers pay</span><strong>{priceN > 0 ? fmt(priceN) : '—'}</strong></div>
                {priceN > DEAL_CAP && <div className="warn">The Begum Beauty deals are priced under PKR 4,999.</div>}
              </>
            ) : origN > priceN && priceN > 0 ? (
              <div><span>Discount shown to customers</span><strong>{discountPct({ price: priceN, originalPrice: origN })}% off · saves {fmt(origN - priceN)}</strong></div>
            ) : (
              <div><span>No discount. Add an original price above the selling price to show one.</span></div>
            )}
          </div>
        </fieldset>

        {type === 'product' && (
          <fieldset>
            <legend>Variants (shades)</legend>
            <div style={{ display: 'grid', gap: 10 }}>
              {shades.length ? shades.map((s, i) => (
                <div className="variant-row" key={i}>
                  <input type="color" value={/^#[0-9a-f]{6}$/i.test(s.hex) ? s.hex : '#b5566a'} aria-label={`Colour for shade ${i + 1}`}
                    onChange={(e) => setShades((all) => all.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))} />
                  <input className="input" value={s.name} aria-label={`Shade ${i + 1} name`}
                    onChange={(e) => setShades((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <button type="button" className="link-btn" onClick={() => setShades((all) => all.filter((_, j) => j !== i))} aria-label={`Remove shade ${i + 1}`}>Remove</button>
                </div>
              )) : <p className="adm-muted">No shades. Add shades for products that come in different colours.</p>}
            </div>
            <button type="button" className="btn btn--secondary btn--sm" style={{ justifySelf: 'start' }} onClick={() => setShades((all) => [...all, { name: 'New shade', hex: '#B5566A' }])}>
              <Icon name="plus" className="icon--sm" />Add shade
            </button>
          </fieldset>
        )}

        <fieldset>
          <legend>Highlights and details</legend>
          <div className="field">
            <label htmlFor="ed-features">Key features</label>
            <textarea className="textarea" id="ed-features" value={features} onChange={(e) => setFeatures(e.target.value)} placeholder={'Long-wearing matte finish\nEnriched with vitamin E'} />
            <span className="hint">One feature per line.</span>
          </div>
          <div className="field"><label htmlFor="ed-usage">How to use</label><textarea className="textarea" id="ed-usage" value={usage} onChange={(e) => setUsage(e.target.value)} style={{ minHeight: 72 }} /></div>
          <div className="field">
            <span className="label" id="ed-specs-label">Specifications</span>
            <div style={{ display: 'grid', gap: 8 }} role="group" aria-labelledby="ed-specs-label">
              {specs.map((r, i) => (
                <div className="spec-row" key={i}>
                  <input className="input" value={r.key} placeholder="Name, e.g. Finish" aria-label={`Specification ${i + 1} name`}
                    onChange={(e) => setSpecs((all) => all.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
                  <input className="input" value={r.value} placeholder="Value, e.g. Matte" aria-label={`Specification ${i + 1} value`}
                    onChange={(e) => setSpecs((all) => all.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <button type="button" className="link-btn" onClick={() => setSpecs((all) => all.filter((_, j) => j !== i))} aria-label={`Remove specification ${i + 1}`}>Remove</button>
                </div>
              ))}
              {type === 'bundle' && <p className="adm-hint">“Items” is filled in automatically from the bundle item list.</p>}
            </div>
            <button type="button" className="btn btn--secondary btn--sm" style={{ justifySelf: 'start' }} onClick={() => setSpecs((all) => [...all, { key: '', value: '' }])}>
              <Icon name="plus" className="icon--sm" />Add specification
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Labels and visibility</legend>
          <div className="toggles">
            <label className="check"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Featured</label>
            <label className="check"><input type="checkbox" checked={bestseller} onChange={(e) => setBestseller(e.target.checked)} /> Bestseller</label>
            <label className="check"><input type="checkbox" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} /> New arrival</label>
          </div>
          <div className="field">
            <label htmlFor="ed-status">Status</label>
            <select className="select" id="ed-status" value={status} onChange={(e) => setStatus(e.target.value as Product['status'])}>
              <option value="published">Published (visible in store)</option>
              <option value="draft">Draft (hidden from store)</option>
            </select>
          </div>
        </fieldset>
      </form>
    </Drawer>
  );
}
