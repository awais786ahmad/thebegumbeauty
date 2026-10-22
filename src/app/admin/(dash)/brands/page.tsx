import type { Metadata } from 'next';
import CollectionView from '@/components/admin/CollectionView';

export const metadata: Metadata = { title: 'Brands' };

export default function AdminBrandsPage() {
  return <CollectionView kind="brands" />;
}
