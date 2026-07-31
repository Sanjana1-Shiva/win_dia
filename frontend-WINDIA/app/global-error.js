"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg,#f8f3ed 0%,#fffdfb 100%)", padding: "40px 20px", textAlign: "center",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#5b3426", margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#84766f", maxWidth: 420, marginBottom: 28 }}>
            We hit an unexpected error. Please try again — if the problem continues, contact our support team.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "linear-gradient(90deg,#c56a3d,#d47b4e)", color: "#fff", padding: "14px 32px",
              borderRadius: 14, fontWeight: 700, border: "none", cursor: "pointer",
              boxShadow: "0 14px 30px rgba(197,106,61,.22)",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
