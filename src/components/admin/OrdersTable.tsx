'use client';
import { Fragment, useState } from 'react';
import { ORDER_STATUSES } from '@/lib/admin/db';
import { fmt } from '@/lib/format';
import type { Order, OrderStatus } from '@/lib/types';
import { StatusPill } from './ui';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const longDate = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

type Props = {
  orders: Order[];
  /** When set, each row gets a status select and an expandable details row. */
  onStatus?: (order: Order, status: OrderStatus) => void;
  savingId?: string | null;
};

export default function OrdersTable({ orders, onStatus, savingId }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const editable = !!onStatus;
  const cols = editable ? 10 : 9;

  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Order</th><th>Date</th><th>Customer</th><th>City</th><th>Products</th><th>Total</th><th>Payment</th><th>Payment status</th><th>Status</th>
            {editable && <th><span className="visually-hidden">Details</span></th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const open = openId === o.id;
            return (
              <Fragment key={o.id}>
                <tr>
                  <td><strong style={{ fontWeight: 500 }}>{o.orderNo}</strong></td>
                  <td title={longDate(o.createdAt)}>{shortDate(o.createdAt)}</td>
                  <td>{o.customerName}<br /><small style={{ color: 'var(--muted)' }}>{o.phone}</small></td>
                  <td>{o.city}</td>
                  <td style={{ whiteSpace: 'normal', minWidth: 180 }}>
                    {o.items.length ? o.items.map((i, k) => <Fragment key={k}>{k > 0 && <br />}{i.name}{i.shade ? ` (${i.shade})` : ''} × {i.qty}</Fragment>) : <span style={{ color: 'var(--muted)' }}>No items</span>}
                  </td>
                  <td>
                    {fmt(o.total)}
                    {o.myoDiscount > 0 && <><br /><small className="adm-myo">Deal −{fmt(o.myoDiscount)}</small></>}
                  </td>
                  <td>{o.payment}</td>
                  <td>{o.paymentStatus}</td>
                  <td>
                    {editable ? (
                      <>
                        <label className="visually-hidden" htmlFor={`st-${o.id}`}>Status for order {o.orderNo}</label>
                        <select className="select" id={`st-${o.id}`} value={o.status} disabled={savingId === o.id} onChange={(e) => onStatus(o, e.target.value as OrderStatus)}>
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </>
                    ) : <StatusPill status={o.status} />}
                  </td>
                  {editable && (
                    <td>
                      <button type="button" className="link-btn" aria-expanded={open} aria-controls={`od-${o.id}`} onClick={() => setOpenId(open ? null : o.id)}>
                        {open ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  )}
                </tr>
                {editable && open && (
                  <tr className="order-detail" id={`od-${o.id}`}>
                    <td colSpan={cols}>
                      <div className="adm-order">
                        <div>
                          <h3>Delivery</h3>
                          <p><strong>{o.customerName}</strong><br />{o.phone}<br />{o.address}<br />{o.city}</p>
                          <p className="adm-order__meta">Placed {longDate(o.createdAt)}</p>
                          {o.notes && <><h3>Customer notes</h3><p>{o.notes}</p></>}
                        </div>
                        <div>
                          <h3>Items</h3>
                          <table className="adm-order__items">
                            <tbody>
                              {o.items.map((i, k) => (
                                <tr key={k}>
                                  <td>{i.name}{i.shade && <small> · Shade: {i.shade}</small>}</td>
                                  <td>{i.qty} × {fmt(i.price)}</td>
                                  <td>{fmt(i.qty * i.price)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <dl className="adm-order__totals">
                            <div><dt>Subtotal (regular prices)</dt><dd>{fmt(o.subtotal)}</dd></div>
                            {o.discount - o.myoDiscount > 0 && <div><dt>Product discounts</dt><dd>−{fmt(o.discount - o.myoDiscount)}</dd></div>}
                            {o.myoDiscount > 0 && <div><dt>Make Your Own Deal</dt><dd>−{fmt(o.myoDiscount)}</dd></div>}
                            <div><dt>Delivery</dt><dd>{o.delivery ? fmt(o.delivery) : 'Free'}</dd></div>
                            <div className="is-total"><dt>Total</dt><dd>{fmt(o.total)}</dd></div>
                          </dl>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
