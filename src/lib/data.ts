import 'server-only';
import { cache } from 'react';
import seed from '@/data/seed.json';
import { bannersFromRows, brandFromRow, categoryFromRow, productFromRow, testimonialFromRow } from './mappers';
import { isSupabaseConfigured } from './supabase/env';
import { supabasePublic } from './supabase/server';
import type { Banners, Brand, Category, MyoSettings, Product, StoreSettings, Testimonial } from './types';

// Storefront data. Reads from Supabase when it is configured, otherwise from the starter data in src/data/seed.json.
const SEED = seed as unknown as {
  brands: Brand[]; categories: Category[]; products: Product[]; testimonials: Testimonial[]; banners: Banners;
  settings: { store: StoreSettings; myo: MyoSettings };
};
export const DEFAULT_STORE = SEED.settings.store;
export const DEFAULT_MYO = SEED.settings.myo;
export const DEFAULT_BANNERS = SEED.banners;

export type StoreData = { settings: StoreSettings; myo: MyoSettings; categories: Category[]; brands: Brand[]; catalog: Product[] };

export const getStoreData = cache(async (): Promise<StoreData> => {
  if (!isSupabaseConfigured()) {
    return { settings: DEFAULT_STORE, myo: DEFAULT_MYO, categories: SEED.categories, brands: SEED.brands, catalog: SEED.products.filter((p) => p.status === 'published') };
  }
  const db = supabasePublic();
  const [s, c, b, p] = await Promise.all([
    db.from('settings').select('key, value'),
    db.from('categories').select('*').order('sort'),
    db.from('brands').select('*').order('sort'),
    db.from('products').select('*').eq('status', 'published').order('added_at', { ascending: false }),
  ]);
  const err = s.error || c.error || b.error || p.error;
  if (err) throw new Error('Could not load store data: ' + err.message);
  const kv = Object.fromEntries((s.data ?? []).map((r) => [r.key, r.value]));
  return {
    settings: { ...DEFAULT_STORE, ...(kv.store ?? {}) },
    myo: { ...DEFAULT_MYO, ...(kv.myo ?? {}) },
    categories: (c.data ?? []).map(categoryFromRow),
    brands: (b.data ?? []).map(brandFromRow),
    catalog: (p.data ?? []).map(productFromRow),
  };
});

export const getProduct = cache(async (id: string): Promise<Product | null> => {
  const { catalog } = await getStoreData();
  return catalog.find((p) => p.id === id) ?? null;
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  if (!isSupabaseConfigured()) return SEED.testimonials;
  const { data, error } = await supabasePublic().from('testimonials').select('*').eq('active', true).order('sort').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(testimonialFromRow);
});

export const getBanners = cache(async (): Promise<Banners> => {
  if (!isSupabaseConfigured()) return DEFAULT_BANNERS;
  const { data, error } = await supabasePublic().from('banners').select('*');
  if (error) throw new Error(error.message);
  return bannersFromRows(data ?? [], DEFAULT_BANNERS);
});
