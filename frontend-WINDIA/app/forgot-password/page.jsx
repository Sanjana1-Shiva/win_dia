"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error || "Unable to send reset email.");
      return;
    }

    setMessage(data.message || "Password reset email sent. Check your inbox.");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "linear-gradient(135deg,#f8f3ed 0%,#fffdfb 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "28px", padding: "48px", boxShadow: "0 20px 60px rgba(197,106,61,.10)", border: "1px solid #f0e6df" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "38px", color: "#5b3426", marginBottom: "16px" }}>Forgot Password</h1>
        <p style={{ color: "#84766f", marginBottom: "32px" }}>Enter your email address and we will send you a reset link.</p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#9e8880" }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            style={{ width: "100%", padding: "14px 16px", marginBottom: "18px", borderRadius: "14px", border: "1.5px solid #eadfd8", background: "#fffaf7", fontSize: "15px", color: "#5b3426", outline: "none" }}
          />

          {error && <p style={{ color: "#d32f2f", marginBottom: "16px" }}>⚠ {error}</p>}
          {message && <p style={{ color: "#2e7d32", marginBottom: "16px" }}>✓ {message}</p>}

          <button type="submit" disabled={loading} style={{ width: "100%", padding: "18px", borderRadius: "16px", border: "none", background: "linear-gradient(90deg,#c56a3d,#d47b4e)", color: "#fff", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 14px 30px rgba(197,106,61,.22)" }}>
            {loading ? "Sending..." : "Send reset email"}
          </button>
        </form>
      </div>
    </div>
  );
}
