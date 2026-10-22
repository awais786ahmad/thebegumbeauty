import type { Metadata } from 'next';
import ShopClient, { type ShopParams } from '@/components/shop/ShopClient';
import { getStoreData } from '@/lib/data';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

async function resolve(sp: Props['searchParams']) {
  const raw = await sp;
  const params: ShopParams = { category: one(raw.category), brand: one(raw.brand), collection: one(raw.collection), q: one(raw.q), type: one(raw.type), sort: one(raw.sort) };
  const { categories, brands, myo } = await getStoreData();
  let heading = 'Shop all makeup', intro = 'Every product and makeup deal in the Begum Beauty range, with free delivery across Pakistan and cash on delivery.';
  const c = params.category ? categories.find((x) => x.id === params.category) : undefined;
  if (c) { heading = c.name; intro = `${c.blurb}. Free delivery across Pakistan and same-day delivery in Lahore.`; }
  if (params.category === 'makeup-bundles') { heading = 'Makeup deals'; intro = 'Curated makeup bundles under PKR 4,999, with the makeup and accessories you need. Each deal shows exactly what is included, for one price.'; }
  const b = params.brand ? brands.find((x) => x.id === params.brand) : undefined;
  if (b) { heading = b.name; intro = `Products from ${b.name} at The Begum Beauty.`; }
  if (params.collection === 'new') { heading = 'New arrivals'; intro = 'The latest additions to the Begum Beauty range.'; }
  if (params.collection === 'bestsellers') { heading = 'Bestsellers'; intro = 'The products our customers reorder most.'; }
  if (params.type === 'products') { heading = 'Make Your Own Deal'; intro = `Pick any ${myo.min} or more single products and get ${myo.percent}% off them in your bag.`; }
  if (params.q) { heading = `Results for “${params.q}”`; intro = 'Refine your results with the filters.'; }
  return { params, heading, intro, filtered: !!(params.category || params.brand || params.collection || params.type) };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { heading, intro, filtered, params } = await resolve(searchParams);
  if (params.q) return { title: heading, robots: { index: false, follow: true } };
  if (!filtered) return { title: 'Shop Makeup Online in Pakistan | Lipstick, Foundation and Makeup Deals', description: intro, alternates: { canonical: '/shop' } };
  const qs = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== 'sort') as [string, string][]).toString();
  return { title: `${heading} | Buy Online in Pakistan`, description: `${intro} Shop ${heading.toLowerCase()} online at The Begum Beauty.`, alternates: { canonical: `/shop?${qs}` } };
}

export default async function ShopPage({ searchParams }: Props) {
  const { params, heading, intro } = await resolve(searchParams);
  return <div className="container"><ShopClient params={params} heading={heading} intro={intro} /></div>;
}
