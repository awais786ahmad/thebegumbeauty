import type { CartLine, MyoSettings, Product } from './types';

// Mirrors public.place_order in supabase/schema.sql, so the bag shows exactly what the order will charge.
export function cartTotals(lines: CartLine[], byId: (id: string) => Product | undefined, myo: MyoSettings) {
  let regular = 0, subtotal = 0, productSave = 0, myoUnits = 0, myoBase = 0;
  for (const l of lines) {
    const p = byId(l.id); if (!p) continue;
    const was = p.originalPrice && p.originalPrice > p.price ? p.originalPrice : p.price;
    regular += was * l.qty; subtotal += p.price * l.qty;
    if (p.type === 'product') { productSave += (was - p.price) * l.qty; myoUnits += l.qty; myoBase += p.price * l.qty; }
  }
  const myoActive = myo.active && myoUnits >= myo.min;
  const myoSave = myoActive ? Math.round((myoBase * myo.percent) / 100) : 0;
  const myoNeed = myo.active ? Math.max(0, myo.min - myoUnits) : 0;
  return { regular, subtotal, productSave, myoSave, myoActive, myoUnits, myoNeed, discount: regular - subtotal + myoSave, delivery: 0, total: subtotal - myoSave };
}
export type Totals = ReturnType<typeof cartTotals>;
