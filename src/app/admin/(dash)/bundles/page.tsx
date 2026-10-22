import type { Metadata } from 'next';
import ProductsView from '@/components/admin/ProductsView';

export const metadata: Metadata = { title: 'Makeup bundles' };

export default function AdminBundlesPage() {
  return <ProductsView type="bundle" />;
}
