"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiGrid, FiExternalLink, FiUser, FiPackage, FiShoppingBag, FiUsers, FiBarChart2, FiTag, FiStar, FiFolder, FiSettings, FiImage, FiEdit3 } from "react-icons/fi";
import AuthGuard from "@/src/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import "./admin.css";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FiGrid },
  { href: "/admin/products", label: "Products", icon: FiPackage },
  { href: "/admin/categories", label: "Categories", icon: FiFolder },
  { href: "/admin/banners", label: "Banners", icon: FiImage },
  { href: "/admin/content", label: "Site Content", icon: FiEdit3 },
  { href: "/admin/orders", label: "Orders", icon: FiShoppingBag },
  { href: "/admin/coupons", label: "Coupons", icon: FiTag },
  { href: "/admin/reviews", label: "Reviews", icon: FiStar },
  { href: "/admin/users", label: "Users", icon: FiUsers },
  { href: "/admin/analytics", label: "Analytics", icon: FiBarChart2 },
  { href: "/admin/settings", label: "Settings", icon: FiSettings },
];

export default function AdminLayout({ children }) {
  return (
    <AuthGuard pageName="the admin panel" adminOnly>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}

function AdminShell({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">WIN-DIA <span>Admin</span></div>
        <nav>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`admin-nav-link ${pathname === href ? "active" : ""}`}>
              <Icon /> {label}
            </Link>
          ))}
        </nav>
        <div className="admin-user-badge"><FiUser /> {user?.email}</div>
        <Link href="/" className="admin-nav-link admin-exit"><FiExternalLink /> Back to site</Link>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
