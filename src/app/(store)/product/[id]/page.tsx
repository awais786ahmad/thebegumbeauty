import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductDetail from '@/components/product/ProductDetail';
import { ProductCard } from '@/components/store/ProductCard';
import { getProduct, getStoreData } from '@/lib/data';
import { fmt } from '@/lib/format';
import { SITE_URL } from '@/lib/site';

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const { catalog } = await getStoreData();
  return catalog.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).id);
  if (!p) return { title: 'Product not found', robots: { index: false } };
  const { brands } = await getStoreData();
  const brand = brands.find((b) => b.id === p.brand)?.name ?? '';
  const title = p.type === 'bundle' ? `${p.name}: Makeup Deal for ${fmt(p.price)}` : `${p.name} by ${brand} | Buy Online in Pakistan`;
  const description = `${p.description} ${fmt(p.price)} with free delivery across Pakistan and cash on delivery.`;
  return { title, description, alternates: { canonical: `/product/${p.id}` }, openGraph: { title, description, images: p.images[0] ? [p.images[0]] : [] } };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const p = await getProduct(id);
  if (!p) notFound();
  const { catalog, brands, categories } = await getStoreData();
  const others = catalog.filter((x) => x.id !== p.id && x.stock > 0);
  const fbt = p.type === 'bundle'
    ? others.filter((x) => x.type === 'product' && !p.items.some((i) => i.name === x.name) && ['brushes-tools', 'beauty-essentials', 'face-makeup'].includes(x.category)).slice(0, 2)
    : others.filter((x) => x.type === 'product' && x.category !== p.category).sort((a, b) => b.reviews - a.reviews).slice(0, 2);
  const related = catalog.filter((x) => x.id !== p.id && (x.category === p.category || x.brand === p.brand))
    .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category) || b.reviews - a.reviews).slice(0, 4);
  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, sku: p.sku, description: p.description,
    image: p.images.map((i) => (i.startsWith('http') ? i : SITE_URL + i)),
    brand: { '@type': 'Brand', name: brands.find((b) => b.id === p.brand)?.name ?? '' }, category: categories.find((c) => c.id === p.category)?.name ?? '',
    offers: { '@type': 'Offer', priceCurrency: 'PKR', price: p.price, url: `${SITE_URL}/product/${p.id}`, availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  };
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    <div className="container"><ProductDetail key={p.id} p={p} fbt={fbt} /></div>
    {related.length > 0 && (
      <div className="container"><section className="section" aria-labelledby="rel-h" style={{ paddingTop: 32 }}>
        <div className="section-head"><h2 id="rel-h">You may also like</h2><Link className="text-link" href="/shop">Shop all</Link></div>
        <div className="grid-products">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
      </section></div>
    )}
  </>);
}
