'use client';
import { useMemo, useState } from 'react';
import { errorMessage } from '@/lib/admin/errors';
import { fetchOrders, ORDER_STATUSES, paymentStatusFor, refreshStore, setOrderStatus } from '@/lib/admin/db';
import { useLoad } from '@/lib/admin/useLoad';
import type { Order, OrderStatus } from '@/lib/types';
import OrdersTable from './OrdersTable';
import { useToast } from './Toast';
import { Empty, Loading, LoadError } from './ui';

export default function OrdersView() {
  const toast = useToast();
  const { data: orders, setData, error, loading, reload } = useLoad(fetchOrders);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (orders ?? []).filter((o) => (!status || o.status === status) && (!needle || `${o.orderNo} ${o.customerName} ${o.city} ${o.phone}`.toLowerCase().includes(needle)));
  }, [orders, q, status]);

  async function changeStatus(o: Order, next: OrderStatus) {
    const prev = { status: o.status, paymentStatus: o.paymentStatus };
    const patch = (s: OrderStatus, ps: string) => setData((all) => all && all.map((x) => (x.id === o.id ? { ...x, status: s, paymentStatus: ps } : x)));
    patch(next, paymentStatusFor(next));
    setSavingId(o.id);
    try {
      await setOrderStatus(o.id, next);
      toast(`Order ${o.orderNo} marked as ${next}`);
      void refreshStore();
    } catch (e) {
      patch(prev.status, prev.paymentStatus);
      toast(errorMessage(e), { error: true });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>All orders</h2>
        <div className="tools">
          <label className="visually-hidden" htmlFor="o-q">Search orders</label>
          <input className="input" id="o-q" type="search" placeholder="Search order, customer or city" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="visually-hidden" htmlFor="o-s">Filter by status</label>
          <select className="select" id="o-s" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => void reload()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      </div>
      <p className="notice" style={{ marginBottom: 16 }}>
        Changing a status saves it straight away. Delivered orders are marked as paid on delivery; every other status is unpaid.
      </p>
      {loading && !orders ? <Loading label="Loading orders…" />
        : error && !orders ? <LoadError error={error} onRetry={reload} />
        : !orders?.length ? <Empty title="No orders yet" text="Orders placed at checkout will appear here." />
        : !list.length ? <Empty title="Nothing matches" text="Try a different search or status." />
        : <OrdersTable orders={list} onStatus={changeStatus} savingId={savingId} />}
    </section>
  );
}
