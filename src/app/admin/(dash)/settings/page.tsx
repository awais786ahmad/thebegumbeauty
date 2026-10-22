import type { Metadata } from 'next';
import SettingsView from '@/components/admin/SettingsView';
import { DEFAULT_STORE } from '@/lib/data';

export const metadata: Metadata = { title: 'Store settings' };

export default function AdminSettingsPage() {
  return <SettingsView defaults={DEFAULT_STORE} />;
}
