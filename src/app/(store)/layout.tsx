import Announce from '@/components/store/Announce';
import Footer from '@/components/store/Footer';
import Header from '@/components/store/Header';
import MetaPixel from '@/components/store/MetaPixel';
import Overlays from '@/components/store/Overlays';
import StoreProvider from '@/components/store/StoreProvider';
import { getStoreData } from '@/lib/data';

export const revalidate = 60;

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const data = await getStoreData();
  return (
    <StoreProvider data={data}>
      <a className="skip-link" href="#main">Skip to content</a>
      <Announce />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Overlays />
      <MetaPixel />
    </StoreProvider>
  );
}
