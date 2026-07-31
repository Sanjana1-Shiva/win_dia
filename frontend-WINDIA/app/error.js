"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", textAlign: "center", fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#5b3426", margin: "0 0 12px" }}>
        Something went wrong
      </h2>
      <p style={{ color: "#84766f", maxWidth: 420, marginBottom: 24 }}>
        Please try again. If this keeps happening, let our support team know.
      </p>
      <button
        onClick={() => reset()}
        style={{
          background: "linear-gradient(90deg,#c56a3d,#d47b4e)", color: "#fff", padding: "13px 30px",
          borderRadius: 14, fontWeight: 700, border: "none", cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
