'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { StoreData } from '@/lib/data';
import { cartTotals, type Totals } from '@/lib/pricing';
import type { CartLine, Product } from '@/lib/types';

type Toast = { msg: string; href?: string; label?: string; action?: 'wishlist' } | null;
type Layer = 'menu' | 'search' | 'wishlist' | 'quickview' | null;

type Ctx = StoreData & {
  byId: (id: string) => Product | undefined;
  brandName: (id: string) => string;
  catName: (id: string) => string;
  lines: CartLine[];
  ready: boolean;
  totals: Totals;
  count: number;
  add: (id: string, qty?: number, shade?: string | null, silent?: boolean) => void;
  setQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  wish: string[];
  toggleWish: (id: string) => void;
  toast: Toast;
  showToast: (t: Toast) => void;
  layer: Layer;
  quickId: string | null;
  openLayer: (l: Exclude<Layer, null>, quickId?: string) => void;
  closeLayers: () => void;
  support: { open: boolean; tab: 'faq' | 'contact' };
  openSupport: (tab?: 'faq' | 'contact') => void;
  closeSupport: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore must be used inside <StoreProvider>');
  return c;
};

const CART_KEY = 'tbb-cart', WISH_KEY = 'tbb-wish';
const read = <T,>(k: string, f: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : f; } catch { return f; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export default function StoreProvider({ data, children }: { data: StoreData; children: React.ReactNode }) {
  const map = useMemo(() => new Map(data.catalog.map((p) => [p.id, p])), [data.catalog]);
  const byId = useCallback((id: string) => map.get(id), [map]);
  const brandName = useCallback((id: string) => data.brands.find((b) => b.id === id)?.name ?? id, [data.brands]);
  const catName = useCallback((id: string) => data.categories.find((c) => c.id === id)?.name ?? id, [data.categories]);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [wish, setWish] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = () => { setLines(read<CartLine[]>(CART_KEY, [])); setWish(read<string[]>(WISH_KEY, [])); };
    load(); setReady(true);
    const onStorage = (e: StorageEvent) => { if (e.key === CART_KEY || e.key === WISH_KEY) load(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const validLines = useMemo(() => lines.filter((l) => map.has(l.id)), [lines, map]);
  const totals = useMemo(() => cartTotals(validLines, byId, data.myo), [validLines, byId, data.myo]);
  const count = validLines.reduce((a, l) => a + l.qty, 0);

  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const save = (next: CartLine[]) => { setLines(next); write(CART_KEY, next); };

  const add = useCallback((id: string, qty = 1, shade: string | null = null, silent = false) => {
    const p = map.get(id); if (!p) return;
    if (p.stock <= 0) { showToast({ msg: `${p.name} is out of stock` }); return; }
    if (shade === null && p.shades.length) shade = p.shades[0].name;
    const current = read<CartLine[]>(CART_KEY, []).filter((l) => map.has(l.id));
    const before = cartTotals(current, (x) => map.get(x), data.myo);
    const next = current.map((l) => ({ ...l }));
    const f = next.find((l) => l.id === id && l.shade === shade);
    if (f) f.qty = Math.min(f.qty + qty, p.stock); else next.push({ id, qty: Math.min(qty, p.stock), shade });
    save(next);
    const after = cartTotals(next, (x) => map.get(x), data.myo);
    if (after.myoActive && !before.myoActive) showToast({ msg: `Make Your Own Deal unlocked: ${data.myo.percent}% off your products`, href: '/cart', label: 'View bag' });
    else if (!silent) showToast({ msg: `${p.name} added to your bag${after.myoNeed > 0 && after.myoUnits > 0 ? `. Add ${after.myoNeed} more for ${data.myo.percent}% off` : ''}`, href: '/cart', label: 'View bag' });
  }, [map, data.myo, showToast]);

  const setQty = (index: number, qty: number) => {
    const next = validLines.map((l) => ({ ...l })); const l = next[index]; if (!l) return;
    l.qty = Math.max(1, Math.min(qty, map.get(l.id)?.stock || 99)); save(next);
  };
  const remove = (index: number) => save(validLines.filter((_, i) => i !== index));
  const clear = () => save([]);

  const toggleWish = (id: string) => {
    const p = map.get(id); if (!p) return;
    const has = wish.includes(id);
    const next = has ? wish.filter((x) => x !== id) : [...wish, id];
    setWish(next); write(WISH_KEY, next);
    showToast(has ? { msg: `Removed ${p.name} from your wishlist` } : { msg: `Saved ${p.name} to your wishlist`, action: 'wishlist', label: 'View wishlist' });
  };

  const [layer, setLayer] = useState<Layer>(null);
  const [quickId, setQuickId] = useState<string | null>(null);
  const [support, setSupport] = useState<{ open: boolean; tab: 'faq' | 'contact' }>({ open: false, tab: 'faq' });
  const openLayer = (l: Exclude<Layer, null>, id?: string) => { setSupport((s) => ({ ...s, open: false })); if (id) setQuickId(id); setLayer(l); };
  const closeLayers = useCallback(() => setLayer(null), []);
  const openSupport = (tab?: 'faq' | 'contact') => { setLayer(null); setSupport((s) => ({ open: true, tab: tab ?? s.tab })); };
  const closeSupport = useCallback(() => setSupport((s) => ({ ...s, open: false })), []);

  useEffect(() => {
    document.documentElement.style.overflow = layer ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeLayers(); closeSupport(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [layer, closeLayers, closeSupport]);

  const value: Ctx = {
    ...data, byId, brandName, catName, lines: validLines, ready, totals, count, add, setQty, remove, clear,
    wish: wish.filter((id) => map.has(id)), toggleWish, toast, showToast, layer, quickId, openLayer, closeLayers,
    support, openSupport, closeSupport,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
