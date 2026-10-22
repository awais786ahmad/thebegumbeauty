import type { MetadataRoute } from 'next';
import { getStoreData } from '@/lib/data';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { catalog, categories, brands } = await getStoreData();
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((c) => ({ url: `${SITE_URL}/shop?category=${c.id}`, lastModified: now, priority: 0.8 })),
    ...brands.map((b) => ({ url: `${SITE_URL}/shop?brand=${b.id}`, lastModified: now, priority: 0.6 })),
    ...catalog.map((p) => ({ url: `${SITE_URL}/product/${p.id}`, lastModified: now, priority: p.type === 'bundle' ? 0.8 : 0.7 })),
    { url: `${SITE_URL}/policies`, lastModified: now, priority: 0.4 },
  ];
}
