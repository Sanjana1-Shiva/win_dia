"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiFilter, FiX, FiGrid, FiList, FiSearch, FiArrowRight, 
  FiCheck, FiAward, FiShield, FiZap, FiChevronDown,
  FiSun, FiStar, FiCalendar, FiCoffee, FiChevronLeft, FiChevronRight,
  FiTag, FiTruck, FiPackage
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../../components/ProductCard/ProductCard';
import { fetchProducts } from './productActions';
import shopHeroVideo from './shop-hero.mp4';
import './Shop.css';

const OCCASION_TABS = [
  { id: 'all',      label: 'All Products',    icon: FiGrid,     color: '#16A34A', desc: 'Browse everything' },
  { id: 'festival', label: 'Festival Season', icon: FiStar,     color: '#F97316', desc: 'Diwali, Holi & more' },
  { id: 'weekend',  label: 'Weekends',        icon: FiCoffee,   color: '#065F46', desc: 'Relax & snack' },
  { id: 'special',  label: 'Special Days',    icon: FiCalendar, color: '#FB923C', desc: 'Gifts & occasions' },
];

const Shop = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const { products, loading } = useSelector((state) => state.products);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [searchInput, setSearchInput] = useState(urlSearchParams.get('search') || '');
  const [searchQuery, setSearchQuery] = useState(urlSearchParams.get('search') || '');
  const [rangeFilter, setRangeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    flavor: [],
    priceRange: { min: 0, max: 500 },
    dietary: [],
    inStockOnly: false,
    categoryId: '',
    sortBy: 'featured',
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => d.success && setCategories(d.categories)).catch(() => {});
  }, []);

  const productsRef = useRef(null);

  // Debounce search input → searchQuery, so we don't hit Supabase on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setSearchQuery(searchInput), 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const flavors = [
    { name: 'Methi',   color: '#EA580C' },
    { name: 'Jeera',   color: '#F97316' },
    { name: 'Garlic',  color: '#FB923C' },
    { name: 'Moringa', color: '#16A34A' }
  ];

  const dietaryOptions = ['Gluten-Free', 'Vegan', 'Low GI'];

  const trustBadges = [
    { icon: FiAward,  text: 'FSSAI Certified' },
    { icon: FiShield, text: 'NABL Lab Tested' },
    { icon: FiZap,    text: 'Startup Karnataka' }
  ];

  // Delivery/offer strip items

  useEffect(() => {
  dispatch(fetchProducts({
    search:      searchQuery,
    flavor:      filters.flavor,
    sortBy:      filters.sortBy,
    minPrice:    filters.priceRange.min,
    maxPrice:    filters.priceRange.max,
    dietary:     filters.dietary,
    inStockOnly: filters.inStockOnly,
    categoryId:  filters.categoryId,
    range:       rangeFilter,
  }));
}, [dispatch, searchQuery, filters, rangeFilter]);

  const computedFilteredProducts = React.useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.flavor.length > 0) {
      filtered = filtered.filter((p) =>
        filters.flavor.some((f) => p.name?.includes(f))
      );
    }

    filtered = filtered.filter(
      (p) => p.price >= filters.priceRange.min && p.price <= filters.priceRange.max
    );

    if (filters.dietary.length > 0) {
      filtered = filtered.filter((p) =>
        filters.dietary.every((pref) => {
          if (pref === 'Gluten-Free') return p.isGlutenFree;
          if (pref === 'Vegan')       return p.isVegan;
          if (pref === 'Low GI')      return p.isLowGI;
          return true;
        })
      );
    }

    if (rangeFilter === 'gluten-free') {
      filtered = filtered.filter((p) => p.isGlutenFree === true);
    } else if (rangeFilter === 'regular') {
      filtered = filtered.filter((p) => p.isGlutenFree === false);
    }

    if (filters.inStockOnly) {
      filtered = filtered.filter((p) => p.count_in_stock > 0);
    }

    if (filters.categoryId) {
      filtered = filtered.filter((p) => p.categoryId === filters.categoryId);
    }

    switch (filters.sortBy) {
      case 'price-low':   filtered.sort((a, b) => a.price - b.price);                     break;
      case 'price-high':  filtered.sort((a, b) => b.price - a.price);                     break;
      case 'name':        filtered.sort((a, b) => a.name.localeCompare(b.name));          break;
      case 'newest':      filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
      case 'popularity':  filtered.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)); break;
      default: break;
    }

    return filtered;
  }, [products, filters, searchQuery, rangeFilter]);

  useEffect(() => { setFilteredProducts(computedFilteredProducts); }, [computedFilteredProducts]);

  const handleFlavorChange    = (f) => setFilters((p) => ({ ...p, flavor:  p.flavor.includes(f)  ? p.flavor.filter((x) => x !== f)  : [...p.flavor, f]  }));
  const handleDietaryChange   = (o) => setFilters((p) => ({ ...p, dietary: p.dietary.includes(o) ? p.dietary.filter((x) => x !== o) : [...p.dietary, o] }));
  const handleFlavorPillClick = (f) => handleFlavorChange(f);
  const clearFilters = () => { setFilters({ flavor: [], priceRange: { min: 0, max: 500 }, dietary: [], inStockOnly: false, categoryId: '', sortBy: 'featured' }); setSearchInput(''); setSearchQuery(''); };
  const getActiveFilterCount  = () => { let c = filters.flavor.length + filters.dietary.length; if (filters.priceRange.min > 0 || filters.priceRange.max < 500) c++; if (filters.inStockOnly) c++; if (filters.categoryId) c++; return c; };

  const scrollToProducts = () => productsRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Build a flat list of "active filter" chips so the user can see and clear
  // individual filters at a glance, instead of only a bulk "Clear All".
  const activeChips = [
    ...filters.flavor.map((f) => ({ key: `flavor-${f}`, label: f, onRemove: () => handleFlavorChange(f) })),
    ...filters.dietary.map((d) => ({ key: `dietary-${d}`, label: d, onRemove: () => handleDietaryChange(d) })),
    ...(filters.inStockOnly ? [{ key: 'stock', label: 'In Stock Only', onRemove: () => setFilters((p) => ({ ...p, inStockOnly: false })) }] : []),
    ...(filters.categoryId ? [{ key: 'cat', label: categories.find((c) => c.id === filters.categoryId)?.name || 'Category', onRemove: () => setFilters((p) => ({ ...p, categoryId: '' })) }] : []),
    ...((filters.priceRange.min > 0 || filters.priceRange.max < 500)
      ? [{ key: 'price', label: `₹${filters.priceRange.min}–₹${filters.priceRange.max}`, onRemove: () => setFilters((p) => ({ ...p, priceRange: { min: 0, max: 500 } })) }]
      : []),
    ...(searchQuery ? [{ key: 'search', label: `"${searchQuery}"`, onRemove: () => { setSearchInput(''); setSearchQuery(''); } }] : []),
  ];

  return (
    <div className="shop-page">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="shop-hero">
        <video
          className="shop-hero-video"
          src={typeof shopHeroVideo === 'string' ? shopHeroVideo : shopHeroVideo.src}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="shop-hero-overlay" />
        <div className="container">
          <motion.div
            className="shop-hero-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* Trust badges */}
            <div className="hero-trust-badges">
              {trustBadges.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={i} className="trust-badge"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                  >
                    <Icon className="badge-icon" /><span>{b.text}</span>
                  </motion.div>
                );
              })}
            </div>

            <motion.h1 className="hero-headline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            Coconut <span className="hero-headline-highlight">Thins</span>
            </motion.h1>

            <motion.div className="hero-flavors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {flavors.map((fl, i) => (
                <span key={fl.name}>
                  {fl.name}
                  {i < flavors.length - 1 && <span className="flavor-separator">•</span>}
                </span>
              ))}
            </motion.div>

            <motion.p className="hero-tagline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              The Divine Healthy Crunch
            </motion.p>

            <motion.p className="hero-description" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              Traditionally roasted, fiber-rich thins made with coconut flour and ancient Indian spices.
            </motion.p>

            {/* ── SEARCH BAR ── */}
<motion.div
  className="hero-search-wrapper"
  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
  transition={{ delay: 0.8 }}
>
  <div className="hero-search">
    <FiSearch className="search-icon" />
    <input
      type="text"
      placeholder="Search products..."
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
    />
    {searchQuery && (
      <button className="clear-search" onClick={() => setSearchQuery('')}>
        <FiX />
      </button>
    )}
  </div>
</motion.div>

            <motion.p className="hero-brand-promise" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
  "WIN-DIA for dine keeps the gut in line" — Rich in nutrients, truly divine.
</motion.p>

            {/* ── REMOVED: Health stats grid ── */}
            {/* ── REMOVED: Quick filter flavor pills ── */}

          </motion.div>
        </div>

      </section>

      {/* ── CATEGORY FILTER BAR ──────────────────────────── */}
<div className="category-filter-bar">
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', padding: '18px 16px', background: '#FFFBF5', borderTop: '1px solid #FDEADA', borderBottom: '1px solid #FDEADA', width: '100%' }}>
  <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>SHOP BY RANGE:</span>
    <button
      className={`category-pill ${rangeFilter === 'gluten-free' ? 'active' : ''}`}
      onClick={() => setRangeFilter('gluten-free')}
    >
      🌾 Gluten Free
    </button>
    <button
      className={`category-pill ${rangeFilter === 'regular' ? 'active' : ''}`}
      onClick={() => setRangeFilter('regular')}
    >
      🌿 Regular Products
    </button>
    </div>
  </div>

      {/* ── OCCASION TABS ────────────────────────────────── */}
      <section className="occasion-tabs-section">
        <div className="container">
          <div className="occasion-tabs-header">
            <h2 className="occasion-title">Shop by Occasion</h2>
            <p className="occasion-subtitle">Pick the perfect snack for every moment</p>
          </div>
          <div className="occasion-tabs">
            {OCCASION_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  className={`occasion-tab ${activeTab === tab.id ? 'active' : ''}`}
                  style={{ '--tab-color': tab.color }}
                  onClick={() => { setActiveTab(tab.id); scrollToProducts(); }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="tab-icon-wrap"><Icon /></span>
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-desc">{tab.desc}</span>
                  {activeTab === tab.id && (
                    <motion.div className="tab-active-bar" layoutId="tabBar" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SHOP CONTENT ─────────────────────────────────── */}
      <div className="container" ref={productsRef}>
        <div className="shop-content">

          {/* Filter Sidebar */}
          <aside className={`filter-sidebar ${showFilters ? 'active' : ''}`}>
            <div className="filter-header">
              <h3>Filters</h3>
              <button className="close-filters" onClick={() => setShowFilters(false)}><FiX /></button>
            </div>

            <div className="filter-section">
              <h4>Sort By</h4>
              <select value={filters.sortBy}
                onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value }))}
                className="sort-select">
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="popularity">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A–Z</option>
              </select>
            </div>

            <div className="filter-section">
              <h4>Availability</h4>
              <div className="filter-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={() => setFilters((p) => ({ ...p, inStockOnly: !p.inStockOnly }))}
                  />
                  <span className="checkbox-custom" />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="filter-section">
                <h4>Category</h4>
                <select
                  className="sort-select"
                  value={filters.categoryId}
                  onChange={(e) => setFilters((p) => ({ ...p, categoryId: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            <div className="filter-section">
              <h4>Flavors</h4>
              <div className="filter-options">
                {flavors.map((fl) => (
                  <label key={fl.name} className="checkbox-label">
                    <input type="checkbox" checked={filters.flavor.includes(fl.name)} onChange={() => handleFlavorChange(fl.name)} />
                    <span className="checkbox-custom" />
                    <span>{fl.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4>Price Range (₹)</h4>
              <div className="price-inputs">
                <input type="number" placeholder="Min" value={filters.priceRange.min}
                  onChange={(e) => setFilters((p) => ({ ...p, priceRange: { ...p.priceRange, min: Number(e.target.value) } }))} />
                <span>–</span>
                <input type="number" placeholder="Max" value={filters.priceRange.max}
                  onChange={(e) => setFilters((p) => ({ ...p, priceRange: { ...p.priceRange, max: Number(e.target.value) } }))} />
              </div>
            </div>

            <div className="filter-section">
              <h4>Dietary Preferences</h4>
              <div className="filter-options">
                {dietaryOptions.map((o) => (
                  <label key={o} className="checkbox-label">
                    <input type="checkbox" checked={filters.dietary.includes(o)} onChange={() => handleDietaryChange(o)} />
                    <span className="checkbox-custom" />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
            </div>

            <button className="clear-filters-btn" onClick={clearFilters}>✕ Clear All Filters</button>
          </aside>

          {/* Products Main */}
          <div className="products-main">

            {/* Toolbar */}
            <div className="products-toolbar">
              <button className="filter-toggle" onClick={() => setShowFilters(true)}>
                <FiFilter /> Filters
                {getActiveFilterCount() > 0 && <span className="filter-count">{getActiveFilterCount()}</span>}
              </button>
              <div className="results-count">
                {filteredProducts.length} Product{filteredProducts.length !== 1 ? 's' : ''} Found
              </div>
              <div className="view-toggle">
                <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} title="Grid View" onClick={() => setViewMode('grid')}><FiGrid /></button>
                <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} title="List View" onClick={() => setViewMode('list')}><FiList /></button>
              </div>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <motion.div className="filter-chips-row" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                {activeChips.map((chip) => (
                  <motion.button
                    key={chip.key}
                    className="filter-chip"
                    onClick={chip.onRemove}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {chip.label} <FiX />
                  </motion.button>
                ))}
                <button className="filter-chip filter-chip--clear" onClick={clearFilters}>Clear all</button>
              </motion.div>
            )}

            {/* Active tab banner */}
            {activeTab !== 'all' && (
              <motion.div className="active-tab-banner"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ '--tab-color': OCCASION_TABS.find(t => t.id === activeTab)?.color }}>
                <span className="atb-label">{OCCASION_TABS.find(t => t.id === activeTab)?.label}</span>
                <span className="atb-desc">{OCCASION_TABS.find(t => t.id === activeTab)?.desc}</span>
                <button className="atb-clear" onClick={() => setActiveTab('all')}><FiX /> Clear</button>
              </motion.div>
            )}

            {/* Products grid — 4 columns */}
            {loading ? (
              <div className={`products-container ${viewMode}`}>
                {Array.from({ length: viewMode === 'list' ? 4 : 8 }).map((_, i) => (
                  <div key={i} className="product-skeleton">
                    <div className="skeleton-img shimmer" />
                    <div className="skeleton-info">
                      <div className="skeleton-line shimmer" style={{ width: '80%' }} />
                      <div className="skeleton-line shimmer" style={{ width: '55%' }} />
                      <div className="skeleton-line shimmer skeleton-price" style={{ width: '40%' }} />
                      <div className="skeleton-btn shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode + activeTab}
                  className={`products-container ${viewMode}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <motion.div
                        key={product._id}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.38, ease: 'easeOut' }}
                      >
                        <ProductCard product={product} index={index} viewMode={viewMode} />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div className="no-products" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <h3>No Products Found</h3>
                      <p>Try adjusting your filters or search query.</p>
                      <button className="btn btn-primary" onClick={clearFilters}>Clear All Filters</button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      

      {/* ── BOTTOM NAVIGATION BUTTONS ────────────────────── */}
      <div className="shop-bottom-nav">
        <button className="shop-bottom-btn shop-bottom-btn--outline" onClick={() => router.push('/')}>
          ← Back to Home
        </button>
        <button className="shop-bottom-btn shop-bottom-btn--filled" onClick={() => router.push('/cart')}>
          View Cart →
        </button>
      </div>

    </div>
  );
};

export default Shop;