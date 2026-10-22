'use client';
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { check, errorMessage } from '@/lib/admin/errors';
import { deleteRow, fetchBrands, fetchCategories, refreshStore } from '@/lib/admin/db';
import { useLoad } from '@/lib/admin/useLoad';
import { slugify } from '@/lib/format';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useToast } from './Toast';
import { Empty, Loading, LoadError, UploadButton } from './ui';

type Kind = 'categories' | 'brands';
type Entry = { id: string; name: string; desc: string; image: string; sort: number };
type ProductRef = { id: string; category_id: string | null; brand_id: string | null; images: string[] | null };

async function fetchProductRefs(): Promise<ProductRef[]> {
  return check<ProductRef[] | null>(await supabaseBrowser().from('products').select('id, category_id, brand_id, images')) ?? [];
}

async function loadCollection(kind: Kind) {
  const [entries, refs] = await Promise.all([
    kind === 'categories'
      ? fetchCategories().then((l) => l.map((c): Entry => ({ id: c.id, name: c.name, desc: c.blurb, image: c.image, sort: c.sort ?? 0 })))
      : fetchBrands().then((l) => l.map((b): Entry => ({ id: b.id, name: b.name, desc: b.note, image: '', sort: b.sort ?? 0 }))),
    fetchProductRefs(),
  ]);
  return { entries, refs };
}
const loadCategories = () => loadCollection('categories');
const loadBrands = () => loadCollection('brands');

export default function CollectionView({ kind }: { kind: Kind }) {
  const toast = useToast();
  const { data, setData, error, loading, reload } = useLoad(kind === 'categories' ? loadCategories : loadBrands);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState<string | null>(null); // 'save' | 'add' | entry id
  const [dirty, setDirty] = useState(false);
  const isCat = kind === 'categories';
  const one = isCat ? 'category' : 'brand';
  const table = kind;
  const refKey = isCat ? 'category_id' : 'brand_id';

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data?.refs ?? []) { const k = r[refKey]; if (k) m.set(k, (m.get(k) ?? 0) + 1); }
    return m;
  }, [data, refKey]);
  const fallbackImage = (id: string) => (data?.refs.find((r) => r[refKey] === id && r.images?.length)?.images ?? [])[0] ?? '';

  const edit = (id: string, patch: Partial<Entry>) => {
    setData((d) => d && { ...d, entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
    setDirty(true);
  };
  const row = (e: Entry) => (isCat ? { id: e.id, name: e.name.trim(), blurb: e.desc.trim(), image: e.image, sort: e.sort } : { id: e.id, name: e.name.trim(), note: e.desc.trim(), sort: e.sort });

  async function saveAll() {
    if (!data) return;
    if (data.entries.some((e) => !e.name.trim())) { toast(`Every ${one} needs a name.`, { error: true }); return; }
    setBusy('save');
    try {
      check(await supabaseBrowser().from(table).upsert(data.entries.map(row)).select('id'));
      setDirty(false);
      void refreshStore();
      toast(`Saved ${kind}. Changes now appear in the store.`);
    } catch (e) { toast(errorMessage(e), { error: true }); }
    finally { setBusy(null); }
  }

  async function add(ev: React.FormEvent) {
    ev.preventDefault();
    const name = newName.trim();
    if (!name || !data) return;
    const root = slugify(name) || one;
    let id = root;
    for (let i = 2; data.entries.some((e) => e.id === id); i++) id = `${root}-${i}`;
    const entry: Entry = { id, name, desc: '', image: '', sort: Math.max(0, ...data.entries.map((e) => e.sort)) + 1 };
    setBusy('add');
    try {
      check(await supabaseBrowser().from(table).insert(row(entry)).select('id').single());
      setData((d) => d && { ...d, entries: [...d.entries, entry] });
      setNewName('');
      void refreshStore();
      toast(`Added ${name}`);
    } catch (e) { toast(errorMessage(e), { error: true }); }
    finally { setBusy(null); }
  }

  async function remove(e: Entry) {
    if (counts.get(e.id)) return;
    if (!confirm(`Delete the ${one} “${e.name}”? This cannot be undone.`)) return;
    setBusy(e.id);
    try {
      await deleteRow(table, e.id);
      setData((d) => d && { ...d, entries: d.entries.filter((x) => x.id !== e.id) });
      void refreshStore();
      toast(`Deleted ${e.name}`);
    } catch (err) { toast(errorMessage(err), { error: true }); }
    finally { setBusy(null); }
  }

  async function setImage(e: Entry, url: string) {
    setData((d) => d && { ...d, entries: d.entries.map((x) => (x.id === e.id ? { ...x, image: url } : x)) });
    try {
      check(await supabaseBrowser().from('categories').update({ image: url }).eq('id', e.id).select('id').single());
      void refreshStore();
      toast(`Image updated for ${e.name}`);
    } catch (err) { toast(errorMessage(err), { error: true }); }
  }

  if (loading && !data) return <Loading label={`Loading ${kind}…`} />;
  if (error || !data) return <LoadError error={error ?? `Could not load ${kind}.`} onRetry={reload} />;

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>{isCat ? 'Categories' : 'Brands'}<span className="adm-count">{data.entries.length}</span></h2>
        <form className="tools" onSubmit={add}>
          <label className="visually-hidden" htmlFor="coll-new">Name of the new {one}</label>
          <input className="input" id="coll-new" placeholder={`New ${one} name`} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <button className="btn btn--primary btn--sm" type="submit" disabled={!newName.trim() || busy === 'add'}>
            <Icon name="plus" className="icon--sm" />{busy === 'add' ? 'Adding…' : `Add ${one}`}
          </button>
        </form>
      </div>
      {!isCat && (
        <p className="notice" style={{ marginBottom: 16 }}>
          Only list brands you actually stock, and only use brand names and logos you have permission to use.
        </p>
      )}
      {!data.entries.length ? <Empty title={`No ${kind} yet`} text={`Add a ${one} above.`} /> : (
        <div className="cards-3">
          {data.entries.map((c) => {
            const n = counts.get(c.id) ?? 0;
            const img = c.image || fallbackImage(c.id);
            return (
              <article className="mcard" key={c.id}>
                {img ? <img src={img} alt="" /> : <div className="adm-card-ph" aria-hidden="true"><Icon name={isCat ? 'folder' : 'star'} /></div>}
                <div className="mcard__body">
                  <div className="field"><label htmlFor={`c-n-${c.id}`}>Name</label><input className="input" id={`c-n-${c.id}`} value={c.name} onChange={(e) => edit(c.id, { name: e.target.value })} /></div>
                  <div className="field"><label htmlFor={`c-d-${c.id}`}>{isCat ? 'Short description' : 'Note'}</label><input className="input" id={`c-d-${c.id}`} value={c.desc} onChange={(e) => edit(c.id, { desc: e.target.value })} /></div>
                  <p>{n} {n === 1 ? 'product' : 'products'} · ID: {c.id}</p>
                  <div className="tools">
                    {isCat && <UploadButton folder="categories" label="Change image" ariaLabel={`Change image for ${c.name}`} onUploaded={(url) => void setImage(c, url)} />}
                    <a className="text-link" href={`/shop?${isCat ? 'category' : 'brand'}=${encodeURIComponent(c.id)}`} target="_blank" rel="noopener">View in store</a>
                    <button type="button" className="link-btn adm-danger" style={{ marginLeft: 'auto' }} disabled={n > 0 || busy === c.id} onClick={() => void remove(c)}
                      title={n > 0 ? `Move or delete its ${n} ${n === 1 ? 'product' : 'products'} first` : undefined}>
                      {busy === c.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                  {n > 0 && <span className="adm-hint">Can’t delete while {n} {n === 1 ? 'product uses' : 'products use'} this {one}.</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div className="adm-savebar">
        <button className="btn btn--primary" type="button" onClick={saveAll} disabled={busy === 'save' || !data.entries.length}>{busy === 'save' ? 'Saving…' : `Save ${kind}`}</button>
        {dirty && <span className="adm-unsaved">You have unsaved changes.</span>}
      </div>
    </section>
  );
}
