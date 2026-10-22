import type { Metadata } from 'next';
import CollectionView from '@/components/admin/CollectionView';

export const metadata: Metadata = { title: 'Categories' };

export default function AdminCategoriesPage() {
  return <CollectionView kind="categories" />;
}
