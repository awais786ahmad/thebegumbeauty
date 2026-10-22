'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Icon from '@/components/Icon';
import { check, checkRows, errorMessage } from '@/lib/admin/errors';
import { deleteRow, fetchTestimonials, refreshStore } from '@/lib/admin/db';
import { testimonialFromRow } from '@/lib/mappers';
import { supabaseBrowser } from '@/lib/supabase/client';
import { useLoad } from '@/lib/admin/useLoad';
import type { Testimonial } from '@/lib/types';
import { useToast } from './Toast';
import { Loading, LoadError, UploadButton } from './ui';

/** A testimonial being edited. `key` is stable for React; `id` is empty until the row exists in the database. */
type Draft = Omit<Testimonial, 'sort'> & { key: string };

const toDraft = (t: Testimonial): Draft => ({ ...t, key: t.id });
let tmp = 0;

export default function ReviewsView() {
  const toast = useToast();
  const { data, setData, error, loading, reload } = useLoad(async () => (await fetchTestimonials()).map(toDraft));
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const edit = (key: string, patch: Partial<Draft>) => { setData((l) => l && l.map((t) => (t.key === key ? { ...t, ...patch } : t))); setDirty(true); };

  function addReview() {
    const key = `new-${++tmp}`;
    setData((l) => [{ key, id: '', name: '', city: '', rating: 5, text: '', image: '', active: true, sample: false }, ...(l ?? [])]);
    setDirty(true);
    setTimeout(() => document.getElementById(`rv-n-${key}`)?.focus(), 0);
  }

  async function remove(t: Draft) {
    if (!confirm(`Delete the review from ${t.name.trim() || 'this customer'}? This cannot be undone.`)) return;
    if (!t.id) { setData((l) => l && l.filter((x) => x.key !== t.key)); return; }
    setDeleting(t.key);
    try {
      await deleteRow('testimonials', t.id);
      setData((l) => l && l.filter((x) => x.key !== t.key));
      void refreshStore();
      toast('Review deleted');
    } catch (e) { toast(errorMessage(e), { error: true }); }
    finally { setDeleting(null); }
  }

  async function save() {
    if (!data) return;
    if (data.some((t) => t.active && (!t.name.trim() || !t.text.trim()))) {
      toast('Each review shown on the homepage needs a customer name and review text.', { error: true });
      return;
    }
    if (data.some((t) => !t.active && !t.text.trim())) {
      toast('Add review text to every review, or delete the empty ones.', { error: true });
      return;
    }
    setSaving(true);
    try {
      const row = (t: Draft, sort: number) => ({
        name: t.name.trim() || 'Customer', city: t.city.trim(), rating: Math.min(5, Math.max(1, Math.round(t.rating))), text: t.text.trim(),
        image: t.image, active: t.active, sample: t.sample, sort,
      });
      const db = supabaseBrowser();
      const existing = data.map((t, i) => ({ t, i })).filter(({ t }) => t.id);
      const fresh = data.map((t, i) => ({ t, i })).filter(({ t }) => !t.id);
      if (existing.length) check(await db.from('testimonials').upsert(existing.map(({ t, i }) => ({ id: t.id, ...row(t, i) }))).select('id'));
      let created: Testimonial[] = [];
      if (fresh.length) created = checkRows(await db.from('testimonials').insert(fresh.map(({ t, i }) => row(t, i))).select()).map(testimonialFromRow);
      // Give new drafts their database ids (insert returns rows in the same order).
      const idByKey = new Map(fresh.map(({ t }, k) => [t.key, created[k]?.id ?? '']));
      setData((l) => l && l.map((t) => (t.id ? t : { ...t, id: idByKey.get(t.key) ?? '' })));
      setDirty(false);
      void refreshStore();
      toast('Reviews saved. The homepage now shows these reviews.');
    } catch (e) { toast(errorMessage(e), { error: true }); }
    finally { setSaving(false); }
  }

  if (loading && !data) return <Loading label="Loading reviews…" />;
  if (error || !data) return <LoadError error={error ?? 'Could not load reviews.'} onRetry={reload} />;

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>Homepage testimonials<span className="adm-count">{data.length}</span></h2>
        <button className="btn btn--primary btn--sm" type="button" onClick={addReview}><Icon name="plus" className="icon--sm" />Add review</button>
      </div>
      <p className="adm-muted" style={{ marginBottom: 16 }}>These reviews appear in the “What customers say” section of the homepage. Only publish genuine reviews, and only use a customer’s photo with their permission.</p>
      {data.length ? (
        <div className="cards-3">
          {data.map((t, i) => (
            <article className="mcard" key={t.key}>
              <div className="mcard__body">
                <div className="rv-head">
                  {t.image ? <img className="rv-avatar" src={t.image} alt="" /> : <span className="rv-avatar" aria-hidden="true">{(t.name.trim()[0] ?? '?').toUpperCase()}</span>}
                  <div className="tools">
                    <UploadButton folder="reviews" label="Photo" ariaLabel={`Photo for review ${i + 1}`} onBusy={(b) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)))} onUploaded={(url) => edit(t.key, { image: url })} />
                    {t.image && <button className="link-btn" type="button" onClick={() => edit(t.key, { image: '' })}>Remove photo</button>}
                  </div>
                </div>
                <div className="grid-2">
                  <div className="field"><label htmlFor={`rv-n-${t.key}`}>Customer name</label><input className="input" id={`rv-n-${t.key}`} value={t.name} onChange={(e) => edit(t.key, { name: e.target.value })} /></div>
                  <div className="field"><label htmlFor={`rv-c-${t.key}`}>City</label><input className="input" id={`rv-c-${t.key}`} value={t.city} onChange={(e) => edit(t.key, { city: e.target.value })} /></div>
                </div>
                <div className="field">
                  <label htmlFor={`rv-r-${t.key}`}>Rating</label>
                  <select className="select" id={`rv-r-${t.key}`} value={t.rating} onChange={(e) => edit(t.key, { rating: Number(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((v) => <option key={v} value={v}>{'★'.repeat(v)}{'☆'.repeat(5 - v)} ({v} out of 5)</option>)}
                  </select>
                </div>
                <div className="field"><label htmlFor={`rv-t-${t.key}`}>Review</label><textarea className="textarea" id={`rv-t-${t.key}`} style={{ minHeight: 96 }} value={t.text} onChange={(e) => edit(t.key, { text: e.target.value })} /></div>
                <div className="tools">
                  <label className="check"><input type="checkbox" checked={t.active} onChange={(e) => edit(t.key, { active: e.target.checked })} /> Show on homepage</label>
                  <label className="check"><input type="checkbox" checked={t.sample} onChange={(e) => edit(t.key, { sample: e.target.checked })} /> Sample review</label>
                  <button className="link-btn adm-danger" type="button" style={{ marginLeft: 'auto' }} disabled={deleting === t.key} onClick={() => void remove(t)}>
                    {deleting === t.key ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
                {!t.id && <span className="adm-hint">New, not saved yet.</span>}
              </div>
            </article>
          ))}
        </div>
      ) : <p className="notice">No reviews yet. Add one to show the section on the homepage.</p>}
      <div className="adm-savebar">
        <button className="btn btn--primary" type="button" onClick={save} disabled={saving || uploads > 0}>{saving ? 'Saving…' : 'Save reviews'}</button>
        <a className="btn btn--secondary" href="/" target="_blank" rel="noopener">Preview homepage</a>
        {dirty && <span className="adm-unsaved">You have unsaved changes.</span>}
      </div>
    </section>
  );
}
