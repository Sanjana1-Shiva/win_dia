"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function AdminCoupons() {
  const { authFetch } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", discountPercent: "", minOrderValue: "", usageLimit: "", expiresAt: "" });

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((d) => d.success && setCoupons(d.coupons))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/coupons", { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { toast.error(data.error || "Could not create coupon"); return; }
      toast.success("Coupon created");
      setForm({ code: "", discountPercent: "", minOrderValue: "", usageLimit: "", expiresAt: "" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon) => {
    const res = await authFetch("/api/admin/coupons", {
      method: "PATCH",
      body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
    });
    const data = await res.json();
    if (data.success) {
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? data.coupon : c)));
    } else {
      toast.error(data.error || "Could not update coupon");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>Coupons</h1>
        <button className="admin-badge admin" style={{ cursor: "pointer", border: "none" }} onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Coupon"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#fff9f4", border: "1px solid #f0e6df", borderRadius: 12, padding: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Code *</label>
            <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WINDIA10" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Discount % *</label>
            <input required type="number" min="1" max="100" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} placeholder="10" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Min Order (₹)</label>
            <input type="number" min="0" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} placeholder="0" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Usage Limit</label>
            <input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Unlimited" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Expires On</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#c56a3d", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        {loading ? <div className="admin-empty">Loading…</div> : coupons.length === 0 ? (
          <div className="admin-empty">No coupons yet</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Used</th><th>Expires</th><th>Status</th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.code}</strong></td>
                  <td>{c.discount_percent}%</td>
                  <td>{c.min_order_value > 0 ? `₹${c.min_order_value}` : "—"}</td>
                  <td>{c.times_used}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                  <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString("en-IN") : "—"}</td>
                  <td>
                    <button
                      className={`admin-badge ${c.active ? "customer" : "admin"}`}
                      style={{ cursor: "pointer", border: "none" }}
                      onClick={() => toggleActive(c)}
                    >
                      {c.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
