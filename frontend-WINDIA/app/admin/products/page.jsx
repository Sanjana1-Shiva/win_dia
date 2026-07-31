"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  name: "", price: "", original_price: "", count_in_stock: "", image_url: "",
  short_description: "", flavor: "", net_weight: "", gi_value: "", category_id: "", variant_group: "",
  is_low_gi: false, is_gluten_free: false, is_vegan: false, is_bestseller: false,
};

export default function AdminProducts() {
  const { authFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => d.success && setCategories(d.categories));
  }, []);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/products").then((r) => r.json()).then((d) => d.success && setProducts(d.products)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || form.count_in_stock === "") { toast.error("Name, price, and stock are required"); return; }
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/products", { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { toast.success("Product created"); setForm(EMPTY_FORM); setShowForm(false); load(); }
      else toast.error(data.error || "Could not create product");
    } finally { setSaving(false); }
  };

  const toggleActive = async (product) => {
    const res = await authFetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ is_active: !product.is_active }) });
    const data = await res.json();
    if (data.success) { toast.success(product.is_active ? "Product deactivated" : "Product activated"); load(); }
    else toast.error(data.error || "Could not update product");
  };

  const updateStock = async (product, newStock) => {
    const res = await authFetch(`/api/admin/products/${product.id}`, { method: "PATCH", body: JSON.stringify({ count_in_stock: newStock }) });
    const data = await res.json();
    if (data.success) load();
    else toast.error(data.error || "Could not update stock");
  };

  const toggleSelect = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleSelectAll = () => setSelectedIds((prev) => (prev.length === products.length ? [] : products.map((p) => p.id)));

  const runBulk = async (action) => {
    if (selectedIds.length === 0) return;
    const label = action === "delete" ? "delete" : action === "activate" ? "activate" : "deactivate";
    if (action === "delete" && !confirm(`Permanently delete ${selectedIds.length} product(s)? This can't be undone.`)) return;

    setBulkBusy(true);
    try {
      await Promise.all(selectedIds.map((id) =>
        action === "delete"
          ? authFetch(`/api/admin/products/${id}`, { method: "DELETE" })
          : authFetch(`/api/admin/products/${id}`, { method: "PATCH", body: JSON.stringify({ is_active: action === "activate" }) })
      ));
      toast.success(`${selectedIds.length} product(s) ${label}d`);
      setSelectedIds([]);
      load();
    } catch {
      toast.error("Some updates failed — please check and retry");
    } finally {
      setBulkBusy(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Name", "Price", "Original Price", "Stock", "SKU", "Flavor", "Status"];
    const rows = products.map((p) => [
      p.name, p.price, p.original_price || "", p.count_in_stock, p.sku || "", p.flavor || "", p.is_active ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>Products</h1>
        <button className="admin-btn" onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ Add Product"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-table-wrap" style={{ padding: 24, marginBottom: 24 }}>
          <div className="admin-form-grid">
            <div className="admin-form-field"><label>Name *</label><input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="admin-form-field"><label>Price (₹) *</label><input className="admin-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="admin-form-field"><label>Original Price (₹)</label><input className="admin-input" type="number" step="0.01" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} /></div>
            <div className="admin-form-field"><label>Stock Quantity *</label><input className="admin-input" type="number" value={form.count_in_stock} onChange={(e) => setForm({ ...form, count_in_stock: e.target.value })} /></div>
            <div className="admin-form-field"><label>Image URL</label><input className="admin-input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://... or /images/yourfile.jpg" /></div>
            <div className="admin-form-field"><label>Flavor / Variant</label><input className="admin-input" value={form.flavor} onChange={(e) => setForm({ ...form, flavor: e.target.value })} /></div>
            <div className="admin-form-field">
              <label>Category</label>
              <select className="admin-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">— Uncategorized —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="admin-form-field">
              <label>Variant Group <span style={{ fontWeight: 400, color: "#a89a92" }}>(optional)</span></label>
              <input
                className="admin-input"
                placeholder="e.g. coconut-chips-family"
                value={form.variant_group}
                onChange={(e) => setForm({ ...form, variant_group: e.target.value })}
              />
              <p style={{ fontSize: 11, color: "#a89a92", marginTop: 4 }}>Give sibling sizes the same value to show them as size options on the product page.</p>
            </div>
            <div className="admin-form-field"><label>Net Weight (g)</label><input className="admin-input" type="number" value={form.net_weight} onChange={(e) => setForm({ ...form, net_weight: e.target.value })} /></div>
            <div className="admin-form-field"><label>GI Value</label><input className="admin-input" type="number" value={form.gi_value} onChange={(e) => setForm({ ...form, gi_value: e.target.value })} /></div>
          </div>
          <div className="admin-form-field" style={{ marginBottom: 16 }}>
            <label>Short Description</label>
            <textarea className="admin-textarea" rows={2} style={{ width: "100%" }} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
          </div>
          <div className="admin-checkbox-row">
            <label><input type="checkbox" checked={form.is_low_gi} onChange={(e) => setForm({ ...form, is_low_gi: e.target.checked })} /> Low GI</label>
            <label><input type="checkbox" checked={form.is_gluten_free} onChange={(e) => setForm({ ...form, is_gluten_free: e.target.checked })} /> Gluten Free</label>
            <label><input type="checkbox" checked={form.is_vegan} onChange={(e) => setForm({ ...form, is_vegan: e.target.checked })} /> Vegan</label>
            <label><input type="checkbox" checked={form.is_bestseller} onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })} /> Bestseller</label>
          </div>
          <button className="admin-btn" disabled={saving} type="submit">{saving ? "Saving…" : "Save Product"}</button>
        </form>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        {selectedIds.length > 0 ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#6b5d55", fontWeight: 600 }}>{selectedIds.length} selected</span>
            <button className="admin-btn admin-btn-outline" disabled={bulkBusy} onClick={() => runBulk("activate")}>Activate</button>
            <button className="admin-btn admin-btn-outline" disabled={bulkBusy} onClick={() => runBulk("deactivate")}>Deactivate</button>
            <button className="admin-btn" style={{ color: "#c4451e" }} disabled={bulkBusy} onClick={() => runBulk("delete")}>Delete</button>
          </div>
        ) : <div />}
        <button className="admin-btn admin-btn-outline" onClick={exportCsv} disabled={products.length === 0}>Export CSV</button>
      </div>

      <div className="admin-table-wrap">
        {loading ? <div className="admin-empty">Loading…</div> : products.length === 0 ? (
          <div className="admin-empty">No products yet. Add your first one above.</div>
        ) : (
          <table className="admin-table">
            <thead><tr>
              <th><input type="checkbox" checked={selectedIds.length === products.length} onChange={toggleSelectAll} /></th>
              <th>Name</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td>{p.name}</td>
                  <td>₹{Number(p.price).toFixed(2)}</td>
                  <td>
                    <input
                      type="number" className="admin-input" style={{ width: 70 }}
                      defaultValue={p.count_in_stock}
                      onBlur={(e) => Number(e.target.value) !== p.count_in_stock && updateStock(p, Number(e.target.value))}
                    />
                  </td>
                  <td><span className={`admin-badge ${p.is_active ? "delivered" : "cancelled"}`}>{p.is_active ? "Active" : "Inactive"}</span></td>
                  <td><button className="admin-btn admin-btn-outline" onClick={() => toggleActive(p)}>{p.is_active ? "Deactivate" : "Activate"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
