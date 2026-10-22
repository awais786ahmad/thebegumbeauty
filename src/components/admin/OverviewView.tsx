'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { fetchOrders, fetchProducts } from '@/lib/admin/db';
import { useLoad } from '@/lib/admin/useLoad';
import { fmt } from '@/lib/format';
import OrdersTable from './OrdersTable';
import { Loading, LoadError, Thumb } from './ui';

const loadOverview = async () => {
  const [products, orders] = await Promise.all([fetchProducts(), fetchOrders()]);
  return { products, orders };
};

export default function OverviewView() {
  const { data, error, loading, reload } = useLoad(loadOverview);

  const stats = useMemo(() => {
    if (!data) return null;
    const { products: P, orders: O } = data;
    const live = O.filter((o) => o.status !== 'Cancelled');
    const low = P.filter((p) => p.stock <= 10).sort((a, b) => a.stock - b.stock);
    const now = new Date();
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (13 - i));
      return { key: d.toDateString(), label: d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2), full: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }), v: 0, n: 0 };
    });
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const o of live) {
      const day = byKey.get(new Date(o.createdAt).toDateString());
      if (day) { day.v += o.total; day.n += 1; }
    }
    return {
      total: P.length,
      bundles: P.filter((p) => p.type === 'bundle').length,
      drafts: P.filter((p) => p.status === 'draft').length,
      orders: O.length,
      revenue: live.reduce((a, o) => a + o.total, 0),
      pending: O.filter((o) => o.status === 'Pending').length,
      low,
      days,
      max: Math.max(...days.map((d) => d.v), 1),
      sum14: days.reduce((a, d) => a + d.v, 0),
    };
  }, [data]);

  if (loading && !data) return <Loading label="Loading overview…" />;
  if (error || !data || !stats) return <LoadError error={error ?? 'Could not load the overview.'} onRetry={reload} />;

  return (
    <>
      <div className="kpis">
        <div className="kpi"><small>Total products</small><strong>{stats.total}</strong><span style={{ color: 'var(--muted)' }}>{stats.bundles} bundles · {stats.drafts} drafts</span></div>
        <div className="kpi"><small>Total orders</small><strong>{stats.orders}</strong><span style={{ color: 'var(--muted)' }}>All time</span></div>
        <div className="kpi"><small>Total revenue</small><strong>{fmt(stats.revenue)}</strong><span>Excludes cancelled orders</span></div>
        <div className="kpi"><small>Pending orders</small><strong>{stats.pending}</strong><span className="warn">Need confirmation</span></div>
        <div className="kpi"><small>Low-stock products</small><strong>{stats.low.length}</strong><span className="warn">10 units or fewer</span></div>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel__head"><h2>Sales overview</h2><span className="demo-pill">Last 14 days · {fmt(stats.sum14)}</span></div>
          <div className="chart" role="img" aria-label={`Daily sales for the last 14 days, ${fmt(stats.sum14)} in total`}>
            {stats.days.map((d) => (
              <div key={d.key} title={`${d.full}: ${fmt(d.v)} from ${d.n} ${d.n === 1 ? 'order' : 'orders'}`}>
                <i style={{ height: `${Math.max(2, (d.v / stats.max) * 100)}%` }} data-v={fmt(d.v)} />
                {d.label}
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>Low stock</h2><Link className="btn btn--secondary btn--sm" href="/admin/products">Manage stock</Link></div>
          <div className="low-list">
            {stats.low.length ? stats.low.slice(0, 6).map((p) => (
              <div key={p.id}>
                <Thumb src={p.images[0]} className="adm-low-thumb" />
                <Link href={p.type === 'bundle' ? '/admin/bundles' : '/admin/products'} className="adm-low-name">{p.name}</Link>
                <b>{p.stock <= 0 ? 'Out of stock' : `${p.stock} left`}</b>
              </div>
            )) : <p style={{ color: 'var(--muted)' }}>All products are well stocked.</p>}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel__head"><h2>Recent orders</h2><Link className="btn btn--secondary btn--sm" href="/admin/orders">View all orders</Link></div>
        {data.orders.length ? <OrdersTable orders={data.orders.slice(0, 6)} /> : <p style={{ color: 'var(--muted)' }}>No orders yet. Orders placed at checkout will appear here.</p>}
      </section>
    </>
  );
}
