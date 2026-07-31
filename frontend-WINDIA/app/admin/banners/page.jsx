"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { FiTrash2, FiPlus } from "react-icons/fi";

export default function AdminBanners() {
  const { authFetch } = useAuth();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", imageUrl: "", linkUrl: "", position: "homepage" });

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/banners").then((r) => r.json()).then((d) => d.success && setBanners(d.banners)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/banners", { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (!data.success) { toast.error(data.error || "Could not create banner"); return; }
      toast.success("Banner created");
      setForm({ title: "", imageUrl: "", linkUrl: "", position: "homepage" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b) => {
    const res = await authFetch("/api/admin/banners", { method: "PATCH", body: JSON.stringify({ id: b.id, isActive: !b.is_active }) });
    const data = await res.json();
    if (data.success) setBanners((prev) => prev.map((x) => (x.id === b.id ? data.banner : x)));
    else toast.error(data.error || "Could not update banner");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner?")) return;
    const res = await authFetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Banner deleted"); setBanners((prev) => prev.filter((b) => b.id !== id)); }
    else toast.error(data.error || "Could not delete banner");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>Banners</h1>
        <button className="admin-badge admin" style={{ cursor: "pointer", border: "none" }} onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ New Banner"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#fff9f4", border: "1px solid #f0e6df", borderRadius: 12, padding: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Diwali Sale" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Image URL *</label>
            <input required value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Link URL</label>
            <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="/shop" style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Position</label>
            <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }}>
              <option value="homepage">Homepage</option>
              <option value="offer">Offer</option>
              <option value="festival">Festival</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" disabled={saving} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#c56a3d", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-table-wrap">
        {loading ? <div className="admin-empty">Loading…</div> : banners.length === 0 ? (
          <div className="admin-empty">No banners yet</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Preview</th><th>Title</th><th>Position</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td><img src={b.image_url} alt={b.title} style={{ width: 80, height: 40, objectFit: "cover", borderRadius: 6 }} /></td>
                  <td><strong>{b.title}</strong></td>
                  <td style={{ textTransform: "capitalize" }}>{b.position}</td>
                  <td>
                    <button className={`admin-badge ${b.is_active ? "customer" : "admin"}`} style={{ cursor: "pointer", border: "none" }} onClick={() => toggleActive(b)}>
                      {b.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td>
                    <button className="admin-btn" style={{ color: "#c4451e", display: "flex", alignItems: "center", gap: 6 }} onClick={() => handleDelete(b.id)}>
                      <FiTrash2 /> Delete
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
