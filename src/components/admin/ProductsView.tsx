'use client';
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { fetchCatalog } from '@/lib/admin/db';
import { useLoad } from '@/lib/admin/useLoad';
import { discountPct, fmt, productHref } from '@/lib/format';
import type { Product } from '@/lib/types';
import ProductEditor from './ProductEditor';
import { Empty, Loading, LoadError, StatusPill, Thumb } from './ui';

export default function ProductsView({ type }: { type: Product['type'] }) {
  const { data, setData, error, loading, reload } = useLoad(fetchCatalog);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const bundle = type === 'bundle';
  const noun = bundle ? 'bundle' : 'product';

  const names = useMemo(() => ({
    brand: new Map((data?.brands ?? []).map((b) => [b.id, b.name])),
    cat: new Map((data?.categories ?? []).map((c) => [c.id, c.name])),
  }), [data]);

  const all = useMemo(() => (data?.products ?? []).filter((p) => p.type === type), [data, type]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((p) => (!status || p.status === status) && (!category || p.category === category)
      && (!needle || `${p.name} ${p.sku} ${names.brand.get(p.brand) ?? ''}`.toLowerCase().includes(needle)));
  }, [all, q, status, category, names]);
  const takenIds = useMemo(() => new Set((data?.products ?? []).map((p) => p.id)), [data]);
  const usedCats = useMemo(() => (data?.categories ?? []).filter((c) => all.some((p) => p.category === c.id)), [data, all]);

  const onSaved = (p: Product, isNew: boolean) => {
    setData((d) => d && { ...d, products: isNew ? [p, ...d.products] : d.products.map((x) => (x.id === p.id ? p : x)) });
    setEditing(null);
  };
  const onDeleted = (id: string) => {
    setData((d) => d && { ...d, products: d.products.filter((x) => x.id !== id) });
    setEditing(null);
  };

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>{bundle ? 'Makeup bundles' : 'Individual products'}{data && <span className="adm-count">{all.length}</span>}</h2>
        <div className="tools">
          <label className="visually-hidden" htmlFor="p-q">Search</label>
          <input className="input" id="p-q" type="search" placeholder="Search name, SKU or brand" value={q} onChange={(e) => setQ(e.target.value)} />
          {!bundle && (
            <>
              <label className="visually-hidden" htmlFor="p-cat">Category</label>
              <select className="select" id="p-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {usedCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </>
          )}
          <label className="visually-hidden" htmlFor="p-st">Status</label>
          <select className="select" id="p-st" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <button className="btn btn--primary btn--sm" type="button" disabled={!data} onClick={() => setEditing('new')}>
            <Icon name="plus" className="icon--sm" />Add {noun}
          </button>
        </div>
      </div>

      {loading && !data ? <Loading label={`Loading ${noun}s…`} />
        : error && !data ? <LoadError error={error} onRetry={reload} />
        : !all.length ? <Empty title={`No ${noun}s yet`} text={`Add your first ${noun} to show it in the store.`} />
        : !list.length ? <Empty title="Nothing matches" text="Try a different search or filter." />
        : (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{bundle ? 'Bundle' : 'Product'}</th><th>SKU</th><th>{bundle ? 'Includes' : 'Category'}</th><th>Price</th>
                  {!bundle && <><th>Original</th><th>Discount</th></>}
                  <th>Stock</th><th>Labels</th><th>Status</th><th><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => {
                  const off = discountPct(p);
                  return (
                    <tr key={p.id}>
                      <td><div className="name"><Thumb src={p.images[0]} /><span><strong>{p.name}</strong><small>{names.brand.get(p.brand) ?? '—'}</small></span></div></td>
                      <td>{p.sku || '—'}</td>
                      <td>{bundle ? `${p.items.length} ${p.items.length === 1 ? 'item' : 'items'}` : names.cat.get(p.category) ?? '—'}</td>
                      <td>{fmt(p.price)}</td>
                      {!bundle && <><td>{p.originalPrice ? fmt(p.originalPrice) : '—'}</td><td>{off ? `${off}%` : '—'}</td></>}
                      <td>{p.stock <= 10 ? <strong className="adm-low">{p.stock}</strong> : p.stock}</td>
                      <td>
                        {p.featured && <span className="tag">Featured</span>}
                        {p.bestseller && <span className="tag">Bestseller</span>}
                        {p.isNew && <span className="tag">New</span>}
                      </td>
                      <td><StatusPill status={p.status === 'draft' ? 'Draft' : 'Published'} /></td>
                      <td>
                        <button className="btn btn--secondary btn--sm" type="button" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}>Edit</button>{' '}
                        {p.status === 'published' && (
                          <a className="btn btn--sm" href={productHref(p.id)} target="_blank" rel="noopener" style={{ paddingInline: 12 }} aria-label={`Preview ${p.name} in the store`}>
                            <Icon name="eye" className="icon--sm" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      {editing && data && (
        <ProductEditor
          key={editing === 'new' ? 'new' : editing.id}
          type={type}
          product={editing === 'new' ? null : editing}
          categories={data.categories}
          brands={data.brands}
          takenIds={takenIds}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </section>
  );
}
