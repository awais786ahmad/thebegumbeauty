import type { Banner, BannerKey, Banners, Brand, Category, Order, Product, Testimonial } from './types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const productFromRow = (r: any): Product => ({
  id: r.id, type: r.type, name: r.name, brand: r.brand_id ?? '', category: r.category_id ?? '', productType: r.product_type ?? '', kind: r.kind ?? '',
  price: r.price, originalPrice: r.original_price ?? null, stock: r.stock, rating: Number(r.rating) || 0, reviews: r.reviews ?? 0,
  addedAt: r.added_at, bestseller: !!r.bestseller, isNew: !!r.is_new, featured: !!r.featured, status: r.status,
  description: r.description ?? '', features: r.features ?? [], specs: r.specs ?? {}, usage: r.usage ?? '', images: r.images ?? [],
  shades: r.shades ?? [], items: r.items ?? [], tone: r.tone ?? '', sku: r.sku ?? '',
});

export const productToRow = (p: Product) => ({
  id: p.id, type: p.type, name: p.name, brand_id: p.brand || null, category_id: p.category || null, product_type: p.productType, kind: p.kind,
  price: p.price, original_price: p.type === 'bundle' ? null : p.originalPrice, stock: p.stock, rating: p.rating, reviews: p.reviews,
  added_at: p.addedAt, bestseller: p.bestseller, is_new: p.isNew, featured: p.featured, status: p.status, description: p.description,
  features: p.features, specs: p.specs, usage: p.usage, images: p.images, shades: p.type === 'bundle' ? [] : p.shades,
  items: p.type === 'bundle' ? p.items : [], tone: p.tone, sku: p.sku || null,
});

export const categoryFromRow = (r: any): Category => ({ id: r.id, name: r.name, blurb: r.blurb ?? '', image: r.image ?? '', sort: r.sort ?? 0 });
export const brandFromRow = (r: any): Brand => ({ id: r.id, name: r.name, note: r.note ?? '', sort: r.sort ?? 0 });
export const testimonialFromRow = (r: any): Testimonial => ({
  id: r.id, name: r.name, city: r.city ?? '', rating: r.rating ?? 5, text: r.text ?? '', image: r.image ?? '', active: !!r.active, sample: !!r.sample, sort: r.sort ?? 0,
});

export const bannersFromRows = (rows: any[], fallback: Banners): Banners => {
  const out = { ...fallback };
  for (const r of rows) {
    if (r.key in out) out[r.key as BannerKey] = { title: r.title, text: r.text, cta: r.cta, link: r.link, image: r.image, active: !!r.active } as Banner;
  }
  return out;
};

export const orderFromRow = (r: any): Order => ({
  id: r.id, orderNo: r.order_no, createdAt: r.created_at, customerName: r.customer_name, phone: r.phone, city: r.city, address: r.address,
  notes: r.notes ?? '', subtotal: r.subtotal, discount: r.discount, myoDiscount: r.myo_discount, delivery: r.delivery, total: r.total,
  payment: r.payment, paymentStatus: r.payment_status, status: r.status,
  items: (r.order_items ?? []).map((i: any) => ({ productId: i.product_id, name: i.name, qty: i.qty, price: i.price, shade: i.shade })),
});
