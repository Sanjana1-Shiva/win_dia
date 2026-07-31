'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiCheckCircle, FiPackage, FiMapPin, FiCreditCard, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';
import TrackingTimeline from '@/src/components/TrackingTimeline/TrackingTimeline';
import './OrderConfirmation.css';

export default function OrderConfirmation() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('orderId');
  const { authFetch, user, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!orderId) { setError('No order specified'); setLoading(false); return; }
    if (!user) { router.replace(`/login?next=/order-confirmation?orderId=${orderId}`); return; }

    let cancelled = false;
    authFetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) setOrder(data.order);
        else setError(data.error || 'Order not found');
      })
      .catch(() => !cancelled && setError('Could not load order details'))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [orderId, user, authLoading]);

  if (loading || authLoading) {
    return <div className="oc-page oc-center"><div className="wd-spinner" /></div>;
  }

  if (error || !order) {
    return (
      <div className="oc-page oc-center">
        <FiAlertCircle size={48} color="#c56a3d" />
        <h2>{error || 'Order not found'}</h2>
        <Link href="/shop" className="oc-btn">Continue Shopping</Link>
      </div>
    );
  }

  const isPaid = order.payment_status === 'paid' || order.payment_method === 'cod';

  return (
    <div className="oc-page">
      <div className="oc-container">
        <div className="oc-hero">
          <FiCheckCircle className="oc-check" />
          <h1>Order Confirmed!</h1>
          <p>Thank you for shopping with WIN-DIA. Your order has been placed successfully.</p>
          <div className="oc-order-number">Order #{order.order_number}</div>
        </div>

        {!isPaid && (
          <div className="oc-warning">
            <FiAlertCircle /> Payment is still pending for this order. If money was deducted from your account, it will reflect here shortly — contact support if it doesn't within an hour.
          </div>
        )}

        <TrackingTimeline order={order} authFetch={authFetch} />

        <div className="oc-grid">
          <div className="oc-card">
            <h3><FiPackage /> Items</h3>
            {order.order_items?.map((item) => (
              <div key={item.id} className="oc-item">
                {item.image && <img src={item.image} alt={item.name} />}
                <div>
                  <p className="oc-item-name">{item.name}</p>
                  <p className="oc-item-meta">Qty: {item.qty} {item.flavor ? `· ${item.flavor}` : ''}</p>
                </div>
                <span className="oc-item-price">₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="oc-card">
            <h3><FiMapPin /> Delivery Address</h3>
            <p className="oc-address-name">{order.shipping_address?.name}</p>
            <p>{order.shipping_address?.street}</p>
            <p>{order.shipping_address?.city}, {order.shipping_address?.state} — {order.shipping_address?.pincode}</p>
            <p>{order.shipping_address?.phone}</p>
          </div>

          <div className="oc-card">
            <h3><FiCreditCard /> Payment Summary</h3>
            <div className="oc-row"><span>Items</span><span>₹{Number(order.items_price).toFixed(2)}</span></div>
            <div className="oc-row"><span>Shipping</span><span>{Number(order.shipping_price) === 0 ? 'FREE' : `₹${Number(order.shipping_price).toFixed(2)}`}</span></div>
            <div className="oc-row"><span>Tax</span><span>₹{Number(order.tax_price).toFixed(2)}</span></div>
            <div className="oc-row oc-total"><span>Total</span><span>₹{Number(order.total_price).toFixed(2)}</span></div>
            <div className="oc-payment-method">
              {order.payment_method === 'cod' ? 'Cash on Delivery' : `Razorpay — ${isPaid ? 'Paid' : 'Pending'}`}
            </div>
          </div>
        </div>

        <div className="oc-actions">
          <Link href="/account" className="oc-btn oc-btn-outline">View My Orders</Link>
          <Link href="/shop" className="oc-btn">Continue Shopping <FiArrowRight /></Link>
        </div>
      </div>
    </div>
  );
}
