'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { useStore } from './StoreProvider';

export default function Announce() {
  const { myo, openSupport } = useStore();
  const msgs = [
    ...(myo.active ? [{ icon: 'gift', text: `Make Your Own Deal: ${myo.percent}% Off ${myo.min}+ Products`, href: '/shop?type=products' }] : []),
    { icon: 'truck', text: 'Free Delivery Across Pakistan' },
    { icon: 'bolt', text: 'Same-Day Delivery in Lahore' },
    { icon: 'headset', text: '24/7 Customer Support' },
  ];
  const [on, setOn] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setOn((i) => (i + 1) % msgs.length), 3800);
    return () => clearInterval(t);
  }, [msgs.length]);
  return (
    <div className="announce" role="region" aria-label="Store announcements">
      <div className="container">
        <ul className="announce__msgs">
          {msgs.map((m, i) => (
            <li key={m.text} className={i === on ? 'is-on' : ''}>
              <Icon name={m.icon} />
              {m.href ? <Link href={m.href}>{m.text}</Link> : m.text}
            </li>
          ))}
        </ul>
        <a className="announce__support" href="#support" onClick={(e) => { e.preventDefault(); openSupport(); }}>
          <Icon name="chat" className="icon--sm" />Get help
        </a>
      </div>
    </div>
  );
}
