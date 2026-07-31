"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function AdminUsers() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/admin/users").then((r) => r.json()).then((d) => d.success && setUsers(d.users)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="admin-h1">Users</h1>
      <div className="admin-table-wrap">
        {loading ? <div className="admin-empty">Loading…</div> : users.length === 0 ? (
          <div className="admin-empty">No users yet</div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Location</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name || "—"}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "—"}</td>
                  <td>{[u.city, u.state].filter(Boolean).join(", ") || "—"}</td>
                  <td><span className={`admin-badge ${u.role}`}>{u.role}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p style={{ color: "#a89a92", fontSize: 13, marginTop: 16 }}>
        To make a user an admin, run this in Supabase SQL Editor:<br />
        <code style={{ background: "#fff9f4", padding: "2px 6px", borderRadius: 4 }}>update public.profiles set role = 'admin' where email = 'their@email.com';</code>
      </p>
    </div>
  );
}
