"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const STATUSES = ["placed", "confirmed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];

export default function AdminOrders() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    authFetch(`/api/admin/orders${qs}`).then((r) => r.json()).then((d) => d.success && setOrders(d.orders)).finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const updateStatus = async (orderId, order_status) => {
    setBusyId(orderId);
    try {
      const res = await authFetch(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ order_status }) });
      const data = await res.json();
      if (data.success) { toast.success("Order updated"); load(); } else toast.error(data.error || "Could not update order");
    } finally { setBusyId(null); }
  };

  const createShipment = async (orderId) => {
    setBusyId(orderId);
    try {
      const res = await authFetch("/api/shipping/create-shipment", { method: "POST", body: JSON.stringify({ orderId }) });
      const data = await res.json();
      if (data.success) { toast.success(`Shipment created — AWB ${data.awbCode}`); load(); } else toast.error(data.error || "Shipment creation failed");
    } finally { setBusyId(null); }
  };

  return (
    <div>
      <h1 className="admin-h1">Orders</h1>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <button
          className="admin-btn admin-btn-outline"
          disabled={orders.length === 0}
          onClick={() => {
            const headers = ["Order #", "Date", "Customer Total", "Payment Status", "Order Status", "AWB Code"];
            const rows = orders.map((o) => [
              o.order_number, new Date(o.created_at).toLocaleDateString("en-IN"),
              o.total_price, o.payment_status, o.order_status, o.awb_code || "",
            ]);
            const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export CSV
        </button>
      </div>
      <div className="admin-table-wrap">
        {loading ? <div className="admin-empty">Loading…</div> : orders.length === 0 ? (
          <div className="admin-empty">No orders found</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Order #</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Shipment</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    {o.order_number}
                    <br />
                    <a href={`/invoice/${o.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#c56a3d" }}>View Invoice</a>
                  </td>
                  <td>{o.order_items?.length ?? 0} item(s)</td>
                  <td>₹{Number(o.total_price).toFixed(2)}</td>
                  <td><span className={`admin-badge ${o.payment_status}`}>{o.payment_status}</span></td>
                  <td>
                    <select className="admin-select" value={o.order_status} disabled={busyId === o.id} onChange={(e) => updateStatus(o.id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </td>
                  <td>{o.awb_code ? `${o.courier_name || ""} ${o.awb_code}` : "—"}</td>
                  <td>{!o.awb_code && <button className="admin-btn" disabled={busyId === o.id} onClick={() => createShipment(o.id)}>Create Shipment</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
