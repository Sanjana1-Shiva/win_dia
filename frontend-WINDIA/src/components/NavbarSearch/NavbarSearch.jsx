"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "./NavbarSearch.css";

export default function NavbarSearch({ iconSize = 24 }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search/products?q=${encodeURIComponent(query.trim())}`)
        .then((r) => r.json())
        .then((d) => d.success && setResults(d.products))
        .finally(() => setLoading(false));
    }, 250); // debounce so we don't fire a request per keystroke
    return () => clearTimeout(timer);
  }, [query]);

  const goToResults = () => {
    if (!query.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
    setOpen(false);
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") goToResults();
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="navsearch-wrap" ref={wrapRef}>
      <button className="iconBtn" aria-label="Search" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" width={iconSize} height={iconSize}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {open && (
        <div className="navsearch-panel">
          <input
            ref={inputRef}
            type="text"
            className="navsearch-input"
            placeholder="Search khakhra, flavors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {loading && <div className="navsearch-status">Searching...</div>}

          {!loading && results.length > 0 && (
            <div className="navsearch-results">
              {results.map((p) => (
                <a
                  key={p.id}
                  href={`/product/${p.id}`}
                  className="navsearch-result"
                  onClick={() => { setOpen(false); setQuery(""); }}
                >
                  <img src={p.image || p.image_url || "/images/windia-logo.png"} alt={p.name} />
                  <div>
                    <p className="navsearch-result-name">{p.name}</p>
                    {p.flavor && <p className="navsearch-result-flavor">{p.flavor}</p>}
                  </div>
                  <span className="navsearch-result-price">₹{Number(p.price).toFixed(0)}</span>
                </a>
              ))}
              <button className="navsearch-viewall" onClick={goToResults}>
                See all results for "{query}"
              </button>
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="navsearch-status">No products found for "{query}"</div>
          )}
        </div>
      )}
    </div>
  );
}
