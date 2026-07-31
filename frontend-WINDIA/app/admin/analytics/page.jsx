"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const STATUS_LABELS = {
  placed: "Placed", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped",
  out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};

export default function AdminAnalytics() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/admin/stats").then((r) => r.json()).then((d) => d.success && setStats(d.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;

  const breakdown = stats?.statusBreakdown || {};
  const maxCount = Math.max(1, ...Object.values(breakdown));

  return (
    <div>
      <h1 className="admin-h1">Analytics</h1>

      <div className="admin-stats-grid">
        <div className="admin-stat-card"><div className="admin-stat-value">₹{(stats?.totalRevenue ?? 0).toFixed(0)}</div><div className="admin-stat-label">Total Revenue</div></div>
        <div className="admin-stat-card"><div className="admin-stat-value">{stats?.totalOrders ?? 0}</div><div className="admin-stat-label">Total Orders</div></div>
        <div className="admin-stat-card"><div className="admin-stat-value">{stats?.totalUsers ?? 0}</div><div className="admin-stat-label">Customers</div></div>
        <div className="admin-stat-card"><div className="admin-stat-value">{stats?.totalProducts ?? 0}</div><div className="admin-stat-label">Products</div></div>
      </div>

      <div className="admin-table-wrap" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 20, color: "#3a2a1e" }}>Orders by Status</h3>
        {Object.keys(breakdown).length === 0 ? (
          <p style={{ color: "#a89a92" }}>No orders yet.</p>
        ) : (
          Object.entries(breakdown).map(([status, count]) => (
            <div key={status} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "#6b5d55", fontWeight: 600 }}>{STATUS_LABELS[status] || status}</span>
                <span style={{ color: "#c56a3d", fontWeight: 700 }}>{count}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "#f5ede6", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(count / maxCount) * 100}%`, background: "linear-gradient(90deg,#c56a3d,#d47b4e)", borderRadius: 999 }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
