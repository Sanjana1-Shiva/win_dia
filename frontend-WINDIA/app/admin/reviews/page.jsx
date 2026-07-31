"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { FiStar, FiTrash2, FiCheckCircle } from "react-icons/fi";

export default function AdminReviews() {
  const { authFetch } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    authFetch("/api/admin/reviews").then((r) => r.json()).then((d) => d.success && setReviews(d.reviews)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this review? This can't be undone.")) return;
    setBusyId(id);
    try {
      const res = await authFetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success("Review deleted"); setReviews((prev) => prev.filter((r) => r.id !== id)); }
      else toast.error(data.error || "Could not delete review");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="admin-h1">Reviews</h1>
      <div className="admin-table-wrap">
        {loading ? <div className="admin-empty">Loading…</div> : reviews.length === 0 ? (
          <div className="admin-empty">No reviews yet</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Product</th><th>Rating</th><th>Review</th><th>Reviewer</th><th>Verified</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>{r.products?.name || "—"}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} style={{ fill: i < r.rating ? "#F5A623" : "none", color: i < r.rating ? "#F5A623" : "#ddd", width: 14, height: 14 }} />
                    ))}
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    {r.title && <strong style={{ display: "block" }}>{r.title}</strong>}
                    <span style={{ color: "#84766f", fontSize: 13 }}>{r.comment}</span>
                  </td>
                  <td>{r.reviewer?.name || r.reviewer?.email || "—"}</td>
                  <td>{r.is_verified_purchase ? <FiCheckCircle style={{ color: "#2D6A4F" }} title="Verified purchase" /> : "—"}</td>
                  <td>{new Date(r.created_at).toLocaleDateString("en-IN")}</td>
                  <td>
                    <button
                      className="admin-btn"
                      disabled={busyId === r.id}
                      onClick={() => handleDelete(r.id)}
                      style={{ display: "flex", alignItems: "center", gap: 6, color: "#c4451e" }}
                    >
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
