import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import SvgSprite from '@/components/SvgSprite';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const display = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--ff-display', display: 'swap' });
const ui = Poppins({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--ff-ui', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'The Begum Beauty | Buy Makeup Online in Pakistan | Makeup Deals and Free Delivery', template: '%s | The Begum Beauty' },
  description: 'Shop makeup online in Pakistan at The Begum Beauty. Curated makeup deals under PKR 4,999, free delivery nationwide, same-day delivery in Lahore and cash on delivery.',
  openGraph: { type: 'website', siteName: 'The Begum Beauty', locale: 'en_PK' },
};
export const viewport: Viewport = { themeColor: '#211A1C', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-PK" className={`${display.variable} ${ui.variable}`}>
      <body>
        <SvgSprite />
        {children}
      </body>
    </html>
  );
}
