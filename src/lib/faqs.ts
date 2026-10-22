import type { MyoSettings, StoreSettings } from './types';

export const faqs = (s: StoreSettings, m: MyoSettings): [string, string, string][] => [
  ['Makeup deals', 'What is included in a makeup deal?', 'Each deal page lists every item included in the deal. You pay one price for the whole deal, and all our deals are priced under PKR 4,999.'],
  ...(m.active ? [['Make Your Own Deal', 'How does Make Your Own Deal work?', `Add any ${m.min} or more single products to your bag, in any mix of categories, and ${m.percent}% comes off those products automatically in your bag and at checkout. Makeup bundles already have their own deal price, so they are not included.`] as [string, string, string]] : []),
  ['Order placement', 'How do I place an order?', 'Add products or deals to your bag, go to checkout, enter your name, phone number, city and address, then place your order. You pay in cash when it arrives.'],
  ['Same-day Lahore delivery', 'Do you deliver the same day in Lahore?', 'Yes. Orders for Lahore are eligible for same-day delivery.'],
  ['Delivery to other cities', 'How long does delivery take outside Lahore?', 'Orders to other cities in Pakistan usually arrive in 3–5 days.'],
  ['Free delivery', 'Is delivery really free?', 'Yes. Delivery is free across Pakistan, with no minimum order value.'],
  ['Open parcel facility', 'Can I open my parcel before I accept it?', 'Yes. You can open your parcel on delivery before accepting it.'],
  ['Cash on delivery', 'How do I pay?', 'Cash on Delivery is the payment method. You pay the rider in cash when your parcel arrives.'],
  ['Order tracking', 'How can I track my order?', 'Contact our support team with your order number and phone number and we will share the latest status of your parcel.'],
  ['Returns and replacements', 'What is your returns policy?', `We replace the order; we do not refund payments. Because you can open your parcel and check it before you accept and pay, please inspect your order at the door. If an item is damaged, faulty or not what you ordered, message us on WhatsApp or call ${s.phone} with your order number and we will replace it.`],
];
