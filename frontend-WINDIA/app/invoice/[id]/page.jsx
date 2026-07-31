"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/src/auth/AuthGuard";
import "./invoice.css";

function InvoiceContent() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => d.success && setOrder(d.order))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="invoice-loading">Loading invoice…</div>;
  if (!order) return <div className="invoice-loading">Order not found, or you don't have access to it.</div>;

  const addr = order.shipping_address || {};

  return (
    <div className="invoice-page">
      <div className="invoice-actions no-print">
        <button onClick={() => window.print()} className="invoice-print-btn">Print / Save as PDF</button>
      </div>

      <div className="invoice-sheet">
        <div className="invoice-header">
          <div>
            <h1 className="invoice-brand">WIN·DIA</h1>
            <p className="invoice-brand-sub">Tax Invoice</p>
          </div>
          <div className="invoice-meta">
            <p><strong>Invoice #:</strong> {order.order_number}</p>
            <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
            <p><strong>Payment:</strong> {order.payment_method === "cod" ? "Cash on Delivery" : "Prepaid (Razorpay)"} — {order.payment_status}</p>
          </div>
        </div>

        <div className="invoice-addresses">
          <div>
            <p className="invoice-label">Billed & Shipped To</p>
            <p className="invoice-address-name">{addr.name}</p>
            <p>{addr.street}</p>
            <p>{addr.city}, {addr.state} — {addr.pincode}</p>
            <p>Phone: {addr.phone}</p>
          </div>
        </div>

        <table className="invoice-table">
          <thead>
            <tr><th>Item</th><th>Flavor</th><th>Qty</th><th>Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            {(order.order_items || []).map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.flavor || "—"}</td>
                <td>{item.qty}</td>
                <td>₹{Number(item.price).toFixed(2)}</td>
                <td>₹{(Number(item.price) * item.qty).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-totals">
          <div className="invoice-totals-row"><span>Subtotal</span><span>₹{Number(order.items_price).toFixed(2)}</span></div>
          <div className="invoice-totals-row"><span>Tax</span><span>₹{Number(order.tax_price).toFixed(2)}</span></div>
          <div className="invoice-totals-row"><span>Shipping</span><span>₹{Number(order.shipping_price).toFixed(2)}</span></div>
          {order.discount_price > 0 && (
            <div className="invoice-totals-row"><span>Discount {order.coupon_code ? `(${order.coupon_code})` : ""}</span><span>−₹{Number(order.discount_price).toFixed(2)}</span></div>
          )}
          <div className="invoice-totals-row invoice-grand-total"><span>Grand Total</span><span>₹{Number(order.total_price).toFixed(2)}</span></div>
        </div>

        <p className="invoice-footer">Thank you for shopping with WIN-DIA. For support, contact care@windia.com.</p>
      </div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <AuthGuard pageName="this invoice">
      <InvoiceContent />
    </AuthGuard>
  );
}
