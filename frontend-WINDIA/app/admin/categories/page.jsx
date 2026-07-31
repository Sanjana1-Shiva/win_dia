"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { FiTrash2, FiPlus } from "react-icons/fi";

export default function AdminCategories() {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/categories").then((r) => r.json()).then((d) => d.success && setCategories(d.categories)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/categories", { method: "POST", body: JSON.stringify({ name: name.trim() }) });
      const data = await res.json();
      if (!data.success) { toast.error(data.error || "Could not create category"); return; }
      toast.success("Category created");
      setName("");
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat) => {
    const res = await authFetch("/api/admin/categories", { method: "PATCH", body: JSON.stringify({ id: cat.id, isActive: !cat.is_active }) });
    const data = await res.json();
    if (data.success) setCategories((prev) => prev.map((c) => (c.id === cat.id ? data.category : c)));
    else toast.error(data.error || "Could not update category");
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category? Products in it won't be deleted, they'll just become uncategorized.")) return;
    const res = await authFetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Category deleted"); setCategories((prev) => prev.filter((c) => c.id !== id)); }
    else toast.error(data.error || "Could not delete category");
  };

  return (
    <div>
      <h1 className="admin-h1">Categories</h1>

      <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <input className="admin-input" style={{ flex: 1, maxWidth: 320 }} placeholder="New category name…" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="admin-btn" type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FiPlus /> {saving ? "Adding…" : "Add Category"}
        </button>
      </form>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-empty">Loading…</div> : categories.length === 0 ? (
          <div className="admin-empty">No categories yet — add one above</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td style={{ color: "#a89a92" }}>{c.slug}</td>
                  <td>
                    <button className={`admin-badge ${c.is_active ? "customer" : "admin"}`} style={{ cursor: "pointer", border: "none" }} onClick={() => toggleActive(c)}>
                      {c.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td>
                    <button className="admin-btn" style={{ color: "#c4451e", display: "flex", alignItems: "center", gap: 6 }} onClick={() => handleDelete(c.id)}>
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
