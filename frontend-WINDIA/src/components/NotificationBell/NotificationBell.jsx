"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiBell, FiPackage, FiCheckCircle, FiTruck } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";

const STATUS_ICON = {
  placed: FiPackage,
  shipped: FiTruck,
  delivered: FiCheckCircle,
};

const STATUS_LABEL = {
  placed: "Order placed",
  confirmed: "Order confirmed",
  shipped: "Order shipped",
  delivered: "Order delivered",
  cancelled: "Order cancelled",
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN");
}

export default function NotificationBell() {
  const { user, authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    authFetch("/api/orders")
      .then((r) => r.json())
      .then((d) => { if (d.success) setOrders((d.orders || []).slice(0, 5)); })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null; // notifications are account-specific — nothing to show a guest

  const recentCount = orders.filter((o) => {
    const hoursSince = (Date.now() - new Date(o.created_at).getTime()) / 3600000;
    return hoursSince < 72; // "unread" = updated in the last 3 days
  }).length;

  return (
    <div className="accountMenuWrapper" ref={wrapRef}>
      <button
        className="iconBtn"
        aria-label={recentCount > 0 ? `Notifications, ${recentCount} recent` : "Notifications"}
        onClick={() => setOpen((s) => !s)}
      >
        <FiBell />
        {recentCount > 0 && <span className="navBadge">{recentCount}</span>}
      </button>

      {open && (
        <div className="accountDropdown" style={{ width: 300 }}>
          <div style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13, borderBottom: "1px solid #eee2d8", color: "#5b3426" }}>
            Notifications
          </div>
          {loading ? (
            <div style={{ padding: 16, fontSize: 13, color: "#84766f" }}>Loading…</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: 16, fontSize: 13, color: "#84766f" }}>No notifications yet — order updates will show up here.</div>
          ) : (
            orders.map((o) => {
              const Icon = STATUS_ICON[o.order_status] || FiPackage;
              return (
                <Link
                  key={o.id}
                  href="/account?tab=orders"
                  className="accountDropdownItem"
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <Icon style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>
                    <span style={{ display: "block" }}>
                      {STATUS_LABEL[o.order_status] || o.order_status} — #{o.order_number}
                    </span>
                    <span style={{ fontSize: 11, color: "#a89a92" }}>{timeAgo(o.created_at)}</span>
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
