"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboard() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/admin/stats").then((r) => r.json()).then((d) => d.success && setStats(d.stats)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="admin-h1">Dashboard</h1>
      {loading ? <p>Loading…</p> : (
        <div className="admin-stats-grid">
          <div className="admin-stat-card"><div className="admin-stat-value">{stats?.totalOrders ?? 0}</div><div className="admin-stat-label">Total Orders</div></div>
          <div className="admin-stat-card"><div className="admin-stat-value">{stats?.pendingOrders ?? 0}</div><div className="admin-stat-label">Pending Orders</div></div>
          <div className="admin-stat-card"><div className="admin-stat-value">₹{(stats?.totalRevenue ?? 0).toFixed(0)}</div><div className="admin-stat-label">Revenue (Paid)</div></div>
          <div className="admin-stat-card"><div className="admin-stat-value">{stats?.totalProducts ?? 0}</div><div className="admin-stat-label">Products</div></div>
          <div className="admin-stat-card"><div className="admin-stat-value">{stats?.totalUsers ?? 0}</div><div className="admin-stat-label">Registered Users</div></div>
        </div>
      )}
      <p style={{ color: "#a89a92", fontSize: 13 }}>
        Use the sidebar to manage Products, Orders, Users, and view detailed Analytics.
      </p>
    </div>
  );
}
