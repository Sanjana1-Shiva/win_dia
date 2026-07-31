"use client";

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/src/auth/LoginModal";
import NavbarSearch from "@/src/components/NavbarSearch/NavbarSearch";
import NotificationBell from "@/src/components/NotificationBell/NotificationBell";
import "./Navbar.css";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Our Story & Vision", href: "/about" },
  { label: "Health Benefits & Recipes", href: "/health-benefits" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState("login");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);
  const cartItems = useSelector((state) => state.cart.cartItems || []);
  const wishlistItems = useSelector((state) => state.wishlist.wishlistItems || []);
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.qty || 1), 0);
  const wishlistCount = wishlistItems.length;
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  // A link is "active" if it's the exact current page, or (for non-home
  // links) if the current page is a sub-page of it, e.g. /shop/soap-nuts
  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>

        {/* ── BRAND ── */}
        <Link href="/" className="brand" aria-label="WINDIA Home">
        <img className="brandLogo" src="/images/windia-logo.png" alt="WIN-DIA - The Divine Healthy Crunch" width={120} height={100}/>
          <div className="brandWordmark">
            <span className="brandName">WIN-DIA</span>
            <span className="brandTagline">The Divine Healthy Crunch</span>
          </div>
        </Link>

        {/* ── NAV LINKS ── */}
        <ul className="navLinks">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={isActive(link.href) ? "active" : ""}
                aria-current={isActive(link.href) ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        {/* ── ICONS ── */}
        <div className="navActions">

          {/* Search */}
          <NavbarSearch />

          {/* Wishlist */}
          <Link href="/wishlist" className="iconBtn" aria-label="Wishlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && <span className="navBadge">{wishlistCount}</span>}
          </Link>

          {/* Cart */}
          <Link href="/cart" className="iconBtn" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && <span className="navBadge">{cartCount}</span>}
          </Link>

          <div className="divider" />

          <NotificationBell />

          <div className="accountMenuWrapper" ref={accountMenuRef}>
            <button
              className="iconBtn"
              aria-label={isLoggedIn ? "Open account menu" : "Sign in or register"}
              onClick={() => {
                if (isLoggedIn) {
                  setShowAccountMenu((state) => !state);
                } else {
                  setLoginMode("login");
                  setShowLogin(true);
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {showAccountMenu && isLoggedIn && (
              <div className="accountDropdown">
                <Link href="/account" className="accountDropdownItem" onClick={() => setShowAccountMenu(false)}>
                  Profile
                </Link>
                <Link href="/wishlist" className="accountDropdownItem" onClick={() => setShowAccountMenu(false)}>
                  Wishlist
                </Link>
                <Link href="/cart" className="accountDropdownItem" onClick={() => setShowAccountMenu(false)}>
                  Cart
                </Link>
                <button className="accountDropdownItemButton" onClick={async () => { setShowAccountMenu(false); await logout(); router.push('/'); }}>
                  Sign Out
                </button>
              </div>
            )}

            {showAccountMenu && !isLoggedIn && (
              <div className="accountDropdown">
                <button className="accountDropdownItemButton" onClick={() => { setLoginMode('login'); setShowLogin(true); setShowAccountMenu(false); }}>
                  Sign In
                </button>
                <button className="accountDropdownItemButton" onClick={() => { setLoginMode('register'); setShowLogin(true); setShowAccountMenu(false); }}>
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── HAMBURGER ── */}
        <button
          className={`hamburger ${mobileOpen ? "open" : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span />
          <span />
          <span />
        </button>

      </nav>

      {/* ── MOBILE MENU ── */}
      <div className={`mobileMenu ${mobileOpen ? "mobileOpen" : ""}`}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={isActive(link.href) ? "active" : ""}
            aria-current={isActive(link.href) ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}

        <div className="mobileActions">
          <NavbarSearch iconSize={20} />
          <Link href="/wishlist" className="iconBtn" aria-label="Wishlist">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && <span className="navBadge">{wishlistCount}</span>}
          </Link>
          <Link href="/cart" className="iconBtn" aria-label="Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartCount > 0 && <span className="navBadge">{cartCount}</span>}
          </Link>
          <button className="iconBtn" aria-label="Profile" onClick={() => {
            if (isLoggedIn) {
              setShowAccountMenu((state) => !state);
            } else {
              setLoginMode("login");
              setShowLogin(true);
            }
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={20} height={20}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </div>

      {showLogin && (
        <LoginModal defaultMode={loginMode} onClose={() => setShowLogin(false)} />
      )}

      {/* Page spacer */}
      <div className="navSpacer" />
    </>
  );
}