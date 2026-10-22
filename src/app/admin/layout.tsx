import type { Metadata } from 'next';
import { ToastProvider } from '@/components/admin/Toast';
import '@/styles/admin.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Admin | The Begum Beauty', template: '%s | The Begum Beauty Admin' },
  description: 'The Begum Beauty store admin.',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
