import Link from "next/link";

export const metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <div style={{
      minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#f8f3ed 0%,#fffdfb 100%)", padding: "40px 20px", textAlign: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: 88, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: "#c56a3d" }}>404</div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: "#5b3426", margin: "8px 0 12px" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#84766f", maxWidth: 420, marginBottom: 28 }}>
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link href="/" style={{
        background: "linear-gradient(90deg,#c56a3d,#d47b4e)", color: "#fff", padding: "14px 32px",
        borderRadius: 14, fontWeight: 700, boxShadow: "0 14px 30px rgba(197,106,61,.22)",
      }}>
        Back to Home
      </Link>
    </div>
  );
}
