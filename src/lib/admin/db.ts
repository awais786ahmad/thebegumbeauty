// Admin data access through the browser Supabase client. Row Level Security limits writes to admins.
import { revalidateStore } from '@/app/admin/actions';
import { bannersFromRows, brandFromRow, categoryFromRow, orderFromRow, productFromRow, productToRow, testimonialFromRow } from '@/lib/mappers';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Banner, BannerKey, Banners, Brand, Category, Order, OrderStatus, Product, Testimonial } from '@/lib/types';
import { check, checkRows, type Row } from './errors';

const db = () => supabaseBrowser();

export const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'];
export const BANNER_KEYS: BannerKey[] = ['campaign', 'promoA', 'promoB'];

/** Tells Next.js to rebuild storefront pages. Failures are logged, not shown: the write itself succeeded. */
export async function refreshStore(): Promise<void> {
  try {
    const res = await revalidateStore();
    if (!res.ok) console.warn('Storefront refresh skipped:', res.error);
  } catch (e) {
    console.warn('Storefront refresh failed', e);
  }
}

/* ---------- catalogue ---------- */
export async function fetchProducts(): Promise<Product[]> {
  return checkRows(await db().from('products').select('*').order('added_at', { ascending: false }).order('name')).map(productFromRow);
}
export async function fetchCategories(): Promise<Category[]> {
  return checkRows(await db().from('categories').select('*').order('sort').order('name')).map(categoryFromRow);
}
export async function fetchBrands(): Promise<Brand[]> {
  return checkRows(await db().from('brands').select('*').order('sort').order('name')).map(brandFromRow);
}
export async function fetchCatalog() {
  const [products, categories, brands] = await Promise.all([fetchProducts(), fetchCategories(), fetchBrands()]);
  return { products, categories, brands };
}

export async function insertProduct(p: Product): Promise<Product> {
  return productFromRow(check<Row>(await db().from('products').insert(productToRow(p)).select().single()));
}
export async function updateProduct(p: Product): Promise<Product> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...row } = productToRow(p);
  return productFromRow(check<Row>(await db().from('products').update(row).eq('id', p.id).select().single()));
}
export async function patchProduct(id: string, patch: Record<string, unknown>): Promise<void> {
  check(await db().from('products').update(patch).eq('id', id).select('id').single());
}
export async function deleteProduct(id: string): Promise<void> {
  return deleteRow('products', id);
}

/** Deletes one row by id and fails loudly if nothing was deleted (for example when RLS blocks it). */
export async function deleteRow(table: 'products' | 'categories' | 'brands' | 'testimonials', id: string): Promise<void> {
  const rows = checkRows(await db().from(table).delete().eq('id', id).select('id'));
  if (!rows.length) throw new Error('Nothing was deleted. The item may already be gone, or your account does not have admin rights.');
}

/* ---------- orders ---------- */
export async function fetchOrders(): Promise<Order[]> {
  return checkRows(await db().from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(2000)).map(orderFromRow);
}
export const paymentStatusFor = (s: OrderStatus) => (s === 'Delivered' ? 'Paid on delivery' : 'Unpaid');
export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  check(await db().from('orders').update({ status, payment_status: paymentStatusFor(status) }).eq('id', id).select('id').single());
}

/* ---------- settings ---------- */
export async function fetchSetting<T extends object>(key: string, fallback: T): Promise<T> {
  const row = check<{ value: Partial<T> } | null>(await db().from('settings').select('value').eq('key', key).maybeSingle());
  return { ...fallback, ...(row?.value ?? {}) };
}
/** Merges `value` into the stored JSON for `key` (keeps fields this form does not know about). */
export async function saveSetting<T extends object>(key: string, value: T): Promise<void> {
  const row = check<{ value: object } | null>(await db().from('settings').select('value').eq('key', key).maybeSingle());
  const merged = { ...(row?.value ?? {}), ...value };
  check(await db().from('settings').upsert({ key, value: merged, updated_at: new Date().toISOString() }).select('key').single());
}

/* ---------- banners ---------- */
export async function fetchBanners(fallback: Banners): Promise<Banners> {
  return bannersFromRows(checkRows(await db().from('banners').select('*')), fallback);
}
export async function saveBanners(b: Banners): Promise<void> {
  const now = new Date().toISOString();
  const rows = BANNER_KEYS.map((key) => {
    const x: Banner = b[key];
    return { key, title: x.title, text: x.text, cta: x.cta, link: x.link, image: x.image, active: x.active, updated_at: now };
  });
  check(await db().from('banners').upsert(rows).select('key'));
}

/* ---------- testimonials ---------- */
export async function fetchTestimonials(): Promise<Testimonial[]> {
  return checkRows(await db().from('testimonials').select('*').order('sort').order('created_at', { ascending: false })).map(testimonialFromRow);
}
