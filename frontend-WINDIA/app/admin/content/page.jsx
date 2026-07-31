"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { FiPlus, FiTrash2, FiSave } from "react-icons/fi";

export default function AdminContent() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newField, setNewField] = useState({ key: "", value: "", section: "Custom", label: "" });

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/content").then((r) => r.json()).then((d) => d.success && setItems(d.content)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleValueChange = (key, value) => setItems((prev) => prev.map((c) => (c.key === key ? { ...c, value } : c)));

  const saveField = async (item) => {
    setSavingKey(item.key);
    try {
      const res = await authFetch("/api/admin/content", { method: "PUT", body: JSON.stringify(item) });
      const data = await res.json();
      if (data.success) toast.success("Saved — live on the site now");
      else toast.error(data.error || "Could not save");
    } finally {
      setSavingKey(null);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newField.key || !newField.value) { toast.error("Key and value are required"); return; }
    const res = await authFetch("/api/admin/content", { method: "PUT", body: JSON.stringify(newField) });
    const data = await res.json();
    if (data.success) {
      toast.success("Field added");
      setNewField({ key: "", value: "", section: "Custom", label: "" });
      setShowAdd(false);
      load();
    } else toast.error(data.error || "Could not add field");
  };

  const handleDelete = async (key) => {
    if (!confirm(`Delete "${key}"? Any page reading this field will fall back to its default text.`)) return;
    const res = await authFetch(`/api/admin/content?key=${key}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { toast.success("Field deleted"); setItems((prev) => prev.filter((c) => c.key !== key)); }
    else toast.error(data.error || "Could not delete field");
  };

  const grouped = items.reduce((acc, c) => { (acc[c.section] = acc[c.section] || []).push(c); return acc; }, {});

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 className="admin-h1" style={{ marginBottom: 0 }}>Site Content</h1>
        <button className="admin-badge admin" style={{ cursor: "pointer", border: "none" }} onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? "Cancel" : "+ New Field"}
        </button>
      </div>
      <p style={{ color: "#a89a92", fontSize: 13, marginBottom: 20 }}>
        Edit any text field below and click Save — changes appear on the live site immediately, no code change needed.
      </p>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: "#fff9f4", border: "1px solid #f0e6df", borderRadius: 12, padding: 20, marginBottom: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Key * (e.g. hero.headline)</label>
            <input required value={newField.key} onChange={(e) => setNewField({ ...newField, key: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Section</label>
            <input value={newField.section} onChange={(e) => setNewField({ ...newField, section: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Label</label>
            <input value={newField.label} onChange={(e) => setNewField({ ...newField, label: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Value *</label>
            <textarea required value={newField.value} onChange={(e) => setNewField({ ...newField, value: e.target.value })} rows={2} style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e8dfc0", fontFamily: "inherit" }} />
          </div>
          <div>
            <button type="submit" style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#c56a3d", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Add Field</button>
          </div>
        </form>
      )}

      {loading ? <div className="admin-empty">Loading…</div> : Object.keys(grouped).length === 0 ? (
        <div className="admin-empty">No content fields yet — add one above.</div>
      ) : (
        Object.entries(grouped).map(([section, fields]) => (
          <div key={section} style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#3a2a1e", marginBottom: 10 }}>{section}</h3>
            {fields.map((f) => (
              <div key={f.key} className="admin-card" style={{ maxWidth: "100%", marginBottom: 12, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b5d55" }}>{f.label} <span style={{ color: "#a89a92", fontWeight: 400 }}>({f.key})</span></label>
                  <button onClick={() => handleDelete(f.key)} style={{ background: "none", border: "none", color: "#c4451e", cursor: "pointer" }}><FiTrash2 size={14} /></button>
                </div>
                <textarea
                  className="admin-textarea"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  rows={2}
                  value={f.value}
                  onChange={(e) => handleValueChange(f.key, e.target.value)}
                />
                <button className="admin-btn" style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }} disabled={savingKey === f.key} onClick={() => saveField(f)}>
                  <FiSave size={14} /> {savingKey === f.key ? "Saving…" : "Save"}
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
