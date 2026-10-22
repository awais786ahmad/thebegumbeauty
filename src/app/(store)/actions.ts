'use server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { supabasePublic } from '@/lib/supabase/server';
import { PHONE_RE } from '@/lib/format';
import type { CartLine } from '@/lib/types';

export type PlaceOrderInput = { name: string; phone: string; city: string; address: string; notes: string };
export type PlaceOrderResult = { ok: true; orderNo: string; total: number; myoDiscount: number } | { ok: false; error: string };

const MESSAGES: Record<string, string> = {
  invalid_name: 'Please enter your full name.',
  invalid_phone: 'Enter a valid Pakistani mobile number, such as 0300 1234567.',
  invalid_city: 'Please choose your city.',
  invalid_address: 'Please enter your full delivery address.',
  invalid_items: 'Your bag is empty.',
};

export async function placeOrder(customer: PlaceOrderInput, lines: CartLine[]): Promise<PlaceOrderResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: 'Ordering is not connected yet. The store owner needs to add the Supabase keys.' };
  const phone = String(customer.phone ?? '').replace(/[\s-]/g, '');
  if (!PHONE_RE.test(phone)) return { ok: false, error: MESSAGES.invalid_phone };
  const items = (Array.isArray(lines) ? lines : []).slice(0, 50).map((l) => ({ id: String(l.id), qty: Math.max(1, Math.min(20, Math.floor(Number(l.qty) || 1))), shade: l.shade ? String(l.shade) : null }));
  if (!items.length) return { ok: false, error: MESSAGES.invalid_items };

  const { data, error } = await supabasePublic().rpc('place_order', {
    customer: { name: customer.name, phone: customer.phone, city: customer.city, address: customer.address, notes: customer.notes },
    items,
  });
  if (error) {
    const code = error.message.split(':')[0];
    if (code === 'out_of_stock') return { ok: false, error: `Sorry, ${error.message.split(':').slice(1).join(':')} doesn’t have enough stock left. Please update your bag.` };
    if (code === 'product_not_found') return { ok: false, error: 'One of the products in your bag is no longer available. Please update your bag.' };
    return { ok: false, error: MESSAGES[code] ?? 'We couldn’t place your order. Please try again or contact us on WhatsApp.' };
  }
  const r = data as { order_no: string; total: number; myo_discount: number };
  return { ok: true, orderNo: r.order_no, total: r.total, myoDiscount: r.myo_discount };
}
