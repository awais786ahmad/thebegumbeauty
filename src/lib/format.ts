import type { Product } from './types';

export const fmt = (n: number) => 'PKR ' + Math.round(Number(n) || 0).toLocaleString('en-PK');

export const discountPct = (p: Pick<Product, 'price' | 'originalPrice'>) =>
  p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

export const productHref = (id: string) => `/product/${id}`;

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const telHref = (phone: string) => 'tel:' + phone.replace(/[^\d+]/g, '');
export const waHref = (whatsapp: string) => 'https://wa.me/' + whatsapp.replace(/\D/g, '');

export const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Peshawar', 'Quetta', 'Sialkot',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Abbottabad', 'Sahiwal', 'Sheikhupura', 'Gujrat', 'Mardan', 'Rahim Yar Khan', 'Other city in Pakistan'];

export const deliveryEstimate = (city: string) => city === 'Lahore'
  ? { title: 'Same-Day Delivery in Lahore', text: 'Your order is eligible for same-day delivery.', icon: 'bolt' }
  : { title: 'Delivery Across Pakistan in 3–5 Days', text: city ? `Estimated delivery to ${city}: 3–5 days.` : 'Choose your city to see your delivery estimate.', icon: 'truck' };

export const PHONE_RE = /^(?:\+92|0092|92|0)3\d{9}$/;
