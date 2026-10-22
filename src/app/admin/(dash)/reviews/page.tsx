import type { Metadata } from 'next';
import ReviewsView from '@/components/admin/ReviewsView';

export const metadata: Metadata = { title: 'Customer reviews' };

export default function AdminReviewsPage() {
  return <ReviewsView />;
}
