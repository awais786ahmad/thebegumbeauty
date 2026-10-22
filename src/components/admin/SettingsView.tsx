'use client';
import { useMemo, useState } from 'react';
import Icon from '@/components/Icon';
import { errorMessage } from '@/lib/admin/errors';
import { fetchSetting, refreshStore, saveSetting } from '@/lib/admin/db';
import { useLoad } from '@/lib/admin/useLoad';
import type { StoreSettings } from '@/lib/types';
import { useToast } from './Toast';
import { Loading, LoadError } from './ui';

type Key = Exclude<keyof StoreSettings, 'storeName'>;
type FieldDef = { k: Key; label: string; type?: 'text' | 'url' | 'tel' | 'email' | 'textarea'; hint?: string; placeholder?: string };

const INFO: FieldDef[] = [
  { k: 'tagline', label: 'Tagline' },
  { k: 'address', label: 'Business address' },
  { k: 'instagram', label: 'Instagram link', type: 'url', placeholder: 'https://www.instagram.com/…' },
  { k: 'facebook', label: 'Facebook link', type: 'url', placeholder: 'https://www.facebook.com/…' },
  { k: 'tiktok', label: 'TikTok link', type: 'url', placeholder: 'https://www.tiktok.com/@…' },
  { k: 'youtube', label: 'YouTube link', type: 'url', placeholder: 'https://www.youtube.com/@…' },
];
const SUPPORT: FieldDef[] = [
  { k: 'phone', label: 'Support phone', type: 'tel' },
  { k: 'whatsapp', label: 'WhatsApp number', type: 'tel', hint: 'International format without +, for example 923001234567. Leave empty until the store’s WhatsApp is ready.' },
  { k: 'email', label: 'Support email', type: 'email' },
];

export default function SettingsView({ defaults }: { defaults: StoreSettings }) {
  const load = useMemo(() => () => fetchSetting<StoreSettings>('store', defaults), [defaults]);
  const { data, error, loading, reload } = useLoad(load);
  if (loading && !data) return <Loading label="Loading settings…" />;
  if (error || !data) return <LoadError error={error ?? 'Could not load settings.'} onRetry={reload} />;
  return <SettingsForm initial={data} />;
}

function SettingsForm({ initial }: { initial: StoreSettings }) {
  const toast = useToast();
  const [s, setS] = useState<StoreSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');
  const set = (k: Key, v: string) => { setS((x) => ({ ...x, [k]: v })); setSaved(''); };

  const field = (f: FieldDef) => (
    <div className="field" key={f.k}>
      <label htmlFor={`s-${f.k}`}>{f.label}</label>
      {f.type === 'textarea'
        ? <textarea className="textarea" id={`s-${f.k}`} value={s[f.k]} onChange={(e) => set(f.k, e.target.value)} aria-describedby={f.hint ? `s-${f.k}-hint` : undefined} />
        : <input className="input" id={`s-${f.k}`} type={f.type ?? 'text'} value={s[f.k]} placeholder={f.placeholder} onChange={(e) => set(f.k, e.target.value)} aria-describedby={f.hint ? `s-${f.k}-hint` : undefined} />}
      {f.hint && <span className="hint" id={`s-${f.k}-hint`}>{f.hint}</span>}
    </div>
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const clean = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) as StoreSettings;
    clean.storeName = 'The Begum Beauty';
    const errs: string[] = [];
    if (clean.whatsapp && !/^\d{10,15}$/.test(clean.whatsapp)) errs.push('WhatsApp number must be digits only in international format, for example 923001234567.');
    if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) errs.push('Enter a valid support email.');
    for (const f of INFO.filter((x) => x.type === 'url')) if (clean[f.k] && !/^https?:\/\//i.test(clean[f.k])) errs.push(`${f.label} must start with https://`);
    if (errs.length) { toast(errs.join(' '), { error: true }); return; }
    setSaving(true);
    try {
      await saveSetting('store', clean);
      setS(clean);
      void refreshStore();
      setSaved('Saved. Contact details now appear in the footer and support panel.');
      toast('Store settings saved');
    } catch (err) { toast(errorMessage(err), { error: true }); }
    finally { setSaving(false); }
  }

  const tl = s.seoTitle.length, dl = s.seoDescription.length;
  const lenClass = (n: number, lo: number, hi: number) => (n === 0 ? '' : n < lo || n > hi ? ' adm-len--warn' : ' adm-len--ok');

  return (
    <form onSubmit={save} noValidate style={{ display: 'grid', gap: 24 }}>
      <div className="settings-grid">
        <section className="panel">
          <div className="panel__head"><h2>Store information</h2></div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="field"><label htmlFor="s-name">Store name</label><input className="input" id="s-name" value="The Begum Beauty" readOnly aria-describedby="s-name-hint" /><span className="hint" id="s-name-hint">The brand name is fixed across the site.</span></div>
            {INFO.map(field)}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>Customer support contacts</h2></div>
          <div style={{ display: 'grid', gap: 14 }}>
            {SUPPORT.map(field)}
            <p className="notice">Support is shown to customers as available 24/7.</p>
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>Shipping policy</h2></div>
          <div className="policy-lock">
            <div><Icon name="bolt" />Same-Day Delivery in Lahore<small>Lahore orders</small></div>
            <div><Icon name="truck" />Delivery Across Pakistan in 3–5 Days<small>Other cities</small></div>
            <div><Icon name="cash" />Free Delivery Across Pakistan<small>Delivery charge: PKR 0</small></div>
            <div><Icon name="box" />Open Your Parcel Before Acceptance<small>All orders</small></div>
            <div><Icon name="cash" />Pay Cash on Delivery<small>Only payment method</small></div>
          </div>
          <p className="notice" style={{ marginTop: 14 }}>These policies are fixed in the site code so they stay consistent on every page and match how orders are charged at checkout.</p>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>SEO metadata</h2></div>
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="field">
              <label htmlFor="s-seoTitle">Homepage title</label>
              <input className="input" id="s-seoTitle" value={s.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} aria-describedby="s-seoTitle-hint" />
              <span className="hint" id="s-seoTitle-hint">Aim for about 50–60 characters. <span className={`adm-len${lenClass(tl, 50, 60)}`}>{tl} characters</span></span>
            </div>
            <div className="field">
              <label htmlFor="s-seoDescription">Homepage meta description</label>
              <textarea className="textarea" id="s-seoDescription" value={s.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} aria-describedby="s-seoDescription-hint" />
              <span className="hint" id="s-seoDescription-hint">Aim for about 140–160 characters. <span className={`adm-len${lenClass(dl, 140, 160)}`}>{dl} characters</span></span>
            </div>
          </div>
        </section>
      </div>
      <div className="adm-savebar" style={{ marginTop: 0 }}>
        <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
        <span className="saved" aria-live="polite">{saved}</span>
      </div>
    </form>
  );
}
