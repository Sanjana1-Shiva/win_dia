"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const { authFetch } = useAuth();
  const [taxRate, setTaxRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authFetch("/api/admin/settings").then((r) => r.json()).then((d) => {
      if (d.success) setTaxRate(d.settings.tax_rate_percent || "5");
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify({ key: "tax_rate_percent", value: taxRate }) });
      const data = await res.json();
      if (data.success) toast.success("Settings saved");
      else toast.error(data.error || "Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="admin-h1">Settings</h1>
      <div className="admin-card">
        {loading ? <p>Loading…</p> : (
          <form onSubmit={handleSave}>
            <div className="admin-form-field" style={{ maxWidth: 200, marginBottom: 20 }}>
              <label>Tax / GST Rate (%)</label>
              <input
                className="admin-input"
                type="number" min="0" max="100" step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              <p style={{ fontSize: 12, color: "#a89a92", marginTop: 6 }}>
                Applied to every order's item total at checkout. Changing this affects new orders immediately — existing orders keep their original tax amount.
              </p>
            </div>
            <button className="admin-btn" type="submit" disabled={saving}>{saving ? "Saving…" : "Save Settings"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
