export type Shade = { name: string; hex: string };
export type BundleItem = { name: string; image: string };

export type Product = {
  id: string;
  type: 'product' | 'bundle';
  name: string;
  brand: string;
  category: string;
  productType: string;
  kind: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  rating: number;
  reviews: number;
  addedAt: string;
  bestseller: boolean;
  isNew: boolean;
  featured: boolean;
  status: 'published' | 'draft';
  description: string;
  features: string[];
  specs: Record<string, string>;
  usage: string;
  images: string[];
  shades: Shade[];
  items: BundleItem[];
  tone: string;
  sku: string;
};

export type Category = { id: string; name: string; blurb: string; image: string; sort?: number };
export type Brand = { id: string; name: string; note: string; sort?: number };

export type Testimonial = {
  id: string; name: string; city: string; rating: number; text: string;
  image: string; active: boolean; sample: boolean; sort: number;
};

export type BannerKey = 'campaign' | 'promoA' | 'promoB';
export type Banner = { title: string; text: string; cta: string; link: string; image: string; active: boolean };
export type Banners = Record<BannerKey, Banner>;

export type StoreSettings = {
  storeName: string; tagline: string; phone: string; whatsapp: string; email: string; address: string;
  instagram: string; facebook: string; tiktok: string; youtube: string; seoTitle: string; seoDescription: string;
};
export type MyoSettings = { active: boolean; percent: number; min: number };

export type CartLine = { id: string; qty: number; shade: string | null };

export type OrderStatus = 'Pending' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
export type OrderItem = { productId: string | null; name: string; qty: number; price: number; shade: string | null };
export type Order = {
  id: string; orderNo: string; createdAt: string; customerName: string; phone: string; city: string; address: string; notes: string;
  subtotal: number; discount: number; myoDiscount: number; delivery: number; total: number;
  payment: string; paymentStatus: string; status: OrderStatus; items: OrderItem[];
};
