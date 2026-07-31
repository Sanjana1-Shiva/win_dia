"use client";
import { useEffect, useState } from "react";
import { FiCheck, FiPackage, FiTruck, FiMapPin, FiHome, FiX } from "react-icons/fi";
import "./TrackingTimeline.css";

const STEPS = [
  { key: "placed", label: "Order Placed", icon: FiPackage },
  { key: "confirmed", label: "Confirmed", icon: FiCheck },
  { key: "shipped", label: "Shipped", icon: FiTruck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: FiMapPin },
  { key: "delivered", label: "Delivered", icon: FiHome },
];

// order_status values that map onto each visual step (some backend statuses
// collapse into the same customer-facing step — e.g. "processing" still just
// reads as "Confirmed" until it's actually handed to a courier)
const STATUS_TO_STEP_INDEX = {
  placed: 0, confirmed: 1, processing: 1,
  shipped: 2, out_for_delivery: 3, delivered: 4,
};

export default function TrackingTimeline({ order, authFetch }) {
  const [liveHistory, setLiveHistory] = useState([]);
  const [loadingLive, setLoadingLive] = useState(false);

  const isCancelledOrReturned = ["cancelled", "returned"].includes(order.order_status);
  const currentStepIndex = STATUS_TO_STEP_INDEX[order.order_status] ?? 0;

  useEffect(() => {
    if (!order.awb_code || isCancelledOrReturned) return;
    setLoadingLive(true);
    authFetch(`/api/shipping/track?orderId=${order.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setLiveHistory(d.history || []); })
      .finally(() => setLoadingLive(false));
  }, [order.id, order.awb_code]);

  if (isCancelledOrReturned) {
    return (
      <div className="tt-cancelled">
        <FiX />
        <div>
          <p className="tt-cancelled-title">{order.order_status === "cancelled" ? "Order Cancelled" : "Order Returned"}</p>
          {order.cancel_reason && <p className="tt-cancelled-reason">{order.cancel_reason}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="tt-wrap">
      <div className="tt-steps">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i <= currentStepIndex;
          const isCurrent = i === currentStepIndex;
          return (
            <div key={step.key} className={`tt-step ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
              <div className="tt-step-icon"><Icon /></div>
              <p className="tt-step-label">{step.label}</p>
              {i < STEPS.length - 1 && <div className={`tt-step-line ${i < currentStepIndex ? "done" : ""}`} />}
            </div>
          );
        })}
      </div>

      {order.awb_code && (
        <div className="tt-awb">
          <span>AWB: <strong>{order.awb_code}</strong></span>
          {order.courier_name && <span> · {order.courier_name}</span>}
        </div>
      )}

      {loadingLive && <p className="tt-loading">Fetching live courier updates…</p>}

      {liveHistory.length > 0 && (
        <div className="tt-history">
          <p className="tt-history-title">Courier Updates</p>
          {liveHistory.map((event, i) => {
            // NimbusPost's exact per-scan field names aren't verified yet (see
            // the VERIFY comment in nimbuspost.js trackShipment) — this reads
            // several likely variants rather than assuming one, so the UI
            // still shows something once real data comes through.
            const status = event.status || event.remark || event.activity || event.description || "Update";
            const location = event.location || event.city || event.origin || "";
            const timestamp = event.timestamp || event.date || event.scan_date || event.created_at;
            return (
              <div key={i} className="tt-history-item">
                <div className="tt-history-dot" />
                <div>
                  <p className="tt-history-status">{status}</p>
                  <p className="tt-history-meta">
                    {location ? `${location} · ` : ""}
                    {timestamp ? new Date(timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
