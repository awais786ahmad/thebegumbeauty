import 'server-only';
import { createHash } from 'node:crypto';
import { META_PIXEL_ID } from './meta';
import { SITE_URL } from './site';

// Meta Conversions API: sends the Purchase from the server, so it is counted even when the browser pixel is blocked.
// The event_id matches the browser event, so Meta keeps one copy of each order.
const GRAPH_VERSION = 'v23.0';
const sha = (v: string) => createHash('sha256').update(v).digest('hex');

// 0300 1234567, +92 300 1234567 and 0092... all become 923001234567, the format Meta expects before hashing.
const normPhone = (phone: string) => '92' + phone.replace(/\D/g, '').replace(/^(?:0092|92|0)/, '');

export type PurchaseEvent = {
  orderNo: string; total: number; items: { id: string; qty: number }[];
  name: string; phone: string; city: string;
  ip?: string; userAgent?: string; fbp?: string; fbc?: string;
};

export async function sendPurchase(e: PurchaseEvent) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) return;
  const [first = '', ...rest] = e.name.trim().toLowerCase().split(/\s+/);
  const city = e.city.toLowerCase().replace(/[^a-z]/g, '');
  const user_data: Record<string, unknown> = {
    ph: [sha(normPhone(e.phone))], country: [sha('pk')],
    ...(first && { fn: [sha(first)] }), ...(rest.length && { ln: [sha(rest.join(' '))] }),
    ...(city && !city.startsWith('other') && { ct: [sha(city)] }),
    ...(e.ip && { client_ip_address: e.ip }), ...(e.userAgent && { client_user_agent: e.userAgent }),
    ...(e.fbp && { fbp: e.fbp }), ...(e.fbc && { fbc: e.fbc }),
  };
  const body = {
    data: [{
      event_name: 'Purchase', event_time: Math.floor(Date.now() / 1000), event_id: e.orderNo,
      action_source: 'website', event_source_url: `${SITE_URL}/checkout`, user_data,
      custom_data: {
        currency: 'PKR', value: e.total, order_id: e.orderNo, content_type: 'product',
        content_ids: e.items.map((i) => i.id), contents: e.items.map((i) => ({ id: i.id, quantity: i.qty })),
        num_items: e.items.reduce((a, i) => a + i.qty, 0),
      },
    }],
    ...(process.env.META_TEST_EVENT_CODE && { test_event_code: process.env.META_TEST_EVENT_CODE }),
  };
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) console.error('Meta CAPI error', res.status, await res.text());
  } catch (err) {
    console.error('Meta CAPI request failed', err);
  }
}
