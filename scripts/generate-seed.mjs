// Builds supabase/seed.sql from the HTML prototype's data (../hanis-mart).
// Usage: node scripts/generate-seed.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const proto = path.resolve(root, '../hanis-mart');

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(proto, 'js/products.js'), 'utf8'), sandbox);
const data = sandbox.window.HM_DATA;

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => `${q(JSON.stringify(v))}::jsonb`;
const arr = (a) => `array[${a.map(q).join(', ')}]::text[]`;
const img = (p) => (p && !p.startsWith('http') && !p.startsWith('/') ? '/' + p : p || '');

const out = ['-- The Begum Beauty: starter data. Run after schema.sql.', 'begin;', ''];

out.push('insert into public.brands (id, name, note, sort) values');
out.push(data.brands.map((b, i) => `  (${q(b.id)}, ${q(b.name)}, ${q(b.note)}, ${i})`).join(',\n') +
  '\non conflict (id) do update set name = excluded.name, note = excluded.note, sort = excluded.sort;\n');

out.push('insert into public.categories (id, name, blurb, image, sort) values');
out.push(data.categories.map((c, i) => `  (${q(c.id)}, ${q(c.name)}, ${q(c.blurb)}, ${q(img(c.image))}, ${i})`).join(',\n') +
  '\non conflict (id) do update set name = excluded.name, blurb = excluded.blurb, image = excluded.image, sort = excluded.sort;\n');

const cols = ['id', 'type', 'name', 'brand_id', 'category_id', 'product_type', 'kind', 'price', 'original_price', 'stock', 'rating', 'reviews', 'added_at',
  'bestseller', 'is_new', 'featured', 'status', 'description', 'features', 'specs', 'usage', 'images', 'shades', 'items', 'tone', 'sku'];
out.push(`insert into public.products (${cols.join(', ')}) values`);
out.push(data.products.map((p) => `  (${[
  q(p.id), q(p.type), q(p.name), q(p.brand), q(p.category), q(p.productType), q(p.kind), p.price,
  p.type === 'bundle' || !p.originalPrice ? 'null' : p.originalPrice, p.stock, p.rating, p.reviews, q(p.addedAt),
  !!p.bestseller, !!p.isNew, !!p.featured, q(p.status || 'published'), q(p.description), arr(p.features || []), j(p.specs || {}),
  q(p.usage || ''), arr((p.images || []).map(img)), j(p.shades || []), j((p.items || []).map((x) => ({ name: x.name, image: img(x.image) }))),
  q(p.tone || ''), q(p.sku),
].join(', ')})`).join(',\n') + `\non conflict (id) do update set ${cols.slice(1).map((c) => `${c} = excluded.${c}`).join(', ')};\n`);

const testimonials = [
  ['Ayesha', 'Lahore', 5, 'The Everyday Glow Deal had everything I wear daily. Arrived the same day in Lahore.'],
  ['Sana', 'Karachi', 5, 'I liked being able to open the parcel before paying. The foundation shade matched well.'],
  ['Maryam', 'Islamabad', 4, 'Ordered the Bridal Guest Edit for a wedding. The palette works for day and evening.'],
];
out.push('delete from public.testimonials where sample;');
out.push('insert into public.testimonials (name, city, rating, text, active, sample, sort) values');
out.push(testimonials.map((t, i) => `  (${q(t[0])}, ${q(t[1])}, ${t[2]}, ${q(t[3])}, true, true, ${i})`).join(',\n') + ';\n');

const banners = {
  campaign: { title: 'The Bridal Guest Edit', text: 'Warm eyes, defined liner and a lip that lasts from mehndi to walima. Three full-size products in one deal.', cta: 'Shop the edit', link: '/product/bridal-guest-edit', image: '/assets/images/campaign/bridal-edit.jpg' },
  promoA: { title: 'Winter glow', text: 'Hydrating prep and a breathable foundation for dry-season skin.', cta: 'Shop beauty essentials', link: '/shop?category=beauty-essentials', image: '/assets/images/campaign/winter-glow.jpg' },
  promoB: { title: 'The lip studio', text: 'Velvet Matte Lipstick in five shades chosen for South Asian skin tones.', cta: 'Find your shade', link: '/product/velvet-matte-lipstick', image: '/assets/images/campaign/lip-studio.jpg' },
};
out.push('insert into public.banners (key, title, text, cta, link, image, active) values');
out.push(Object.entries(banners).map(([k, b]) => `  (${q(k)}, ${q(b.title)}, ${q(b.text)}, ${q(b.cta)}, ${q(b.link)}, ${q(b.image)}, true)`).join(',\n') +
  '\non conflict (key) do update set title = excluded.title, text = excluded.text, cta = excluded.cta, link = excluded.link, image = excluded.image, active = excluded.active;\n');

const store = {
  storeName: 'The Begum Beauty', tagline: 'Makeup and beauty essentials, delivered across Pakistan.',
  phone: '0336 1877730', whatsapp: '923361877730', email: 'support@your-domain.pk', address: 'Lahore, Pakistan',
  instagram: 'https://www.instagram.com/', facebook: 'https://www.facebook.com/', tiktok: 'https://www.tiktok.com/', youtube: 'https://www.youtube.com/',
  seoTitle: 'The Begum Beauty | Buy Makeup Online in Pakistan',
  seoDescription: 'Shop makeup online in Pakistan at The Begum Beauty. Curated makeup deals under PKR 4,999, free delivery nationwide, same-day delivery in Lahore and cash on delivery.',
};
out.push('insert into public.settings (key, value) values');
out.push(`  ('store', ${j(store)}),\n  ('myo', ${j({ active: true, percent: 15, min: 2 })})\non conflict (key) do nothing;\n`);

out.push('commit;');

// Same data as JSON for the app's offline fallback (used when Supabase keys are not set)
const json = {
  brands: data.brands.map((b) => ({ id: b.id, name: b.name, note: b.note })),
  categories: data.categories.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb, image: img(c.image) })),
  products: data.products.map((p) => ({
    id: p.id, type: p.type, name: p.name, brand: p.brand, category: p.category, productType: p.productType, kind: p.kind,
    price: p.price, originalPrice: p.type === 'bundle' || !p.originalPrice ? null : p.originalPrice, stock: p.stock, rating: p.rating,
    reviews: p.reviews, addedAt: p.addedAt, bestseller: !!p.bestseller, isNew: !!p.isNew, featured: !!p.featured, status: p.status || 'published',
    description: p.description, features: p.features || [], specs: p.specs || {}, usage: p.usage || '', images: (p.images || []).map(img),
    shades: p.shades || [], items: (p.items || []).map((x) => ({ name: x.name, image: img(x.image) })), tone: p.tone || '', sku: p.sku,
  })),
  testimonials: testimonials.map((t, i) => ({ id: `sample-${i}`, name: t[0], city: t[1], rating: t[2], text: t[3], image: '', active: true, sample: true, sort: i })),
  banners,
  settings: { store, myo: { active: true, percent: 15, min: 2 } },
};
fs.writeFileSync(path.join(root, 'src/data/seed.json'), JSON.stringify(json, null, 1) + '\n');
fs.writeFileSync(path.join(root, 'supabase/seed.sql'), out.join('\n') + '\n');
console.log(`seed.sql written: ${data.brands.length} brands, ${data.categories.length} categories, ${data.products.length} products`);
