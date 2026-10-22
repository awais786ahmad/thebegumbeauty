import type { Metadata } from 'next';
import PromotionsView from '@/components/admin/PromotionsView';
import { DEFAULT_BANNERS, DEFAULT_MYO } from '@/lib/data';

export const metadata: Metadata = { title: 'Promotions' };

export default function AdminPromotionsPage() {
  return <PromotionsView defaultMyo={DEFAULT_MYO} defaultBanners={DEFAULT_BANNERS} />;
}
