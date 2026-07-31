'use client';
import { getProducts } from '../lib/products';

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiShoppingCart, FiTrash2, FiPlus, FiMinus, FiArrowRight,
  FiArrowLeft, FiTag, FiTruck, FiShield, FiPercent,
  FiShare2, FiClock, FiHeart, FiAlertTriangle, FiPackage
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { removeFromCart, updateQuantity, setCart, addToCart,} from '../../../redux/slices/cartSlice';
import { addToWishlist } from '../../../redux/slices/wishlistSlice';
import toast from 'react-hot-toast';
import './Cart.css';

const FREE_SHIPPING_THRESHOLD = 499;

const Cart = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { cartItems } = useSelector((state) => state.cart);
  const { wishlistItems } = useSelector((state) => state.wishlist);

  const [promoCode, setPromoCode]           = useState('');
  const [promoApplied, setPromoApplied]     = useState(false);
  const [isMounted, setIsMounted]           = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs]       = useState(false);

  // ── Load from localStorage + set mounted
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cartItems')) || [];
    dispatch(setCart(storedCart));
    setIsMounted(true);
  }, [dispatch]);

  // ── Save to localStorage on cart change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  // ── Detect shared cart from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shared = params.get('shared');
      if (shared) {
        try {
          const decoded = JSON.parse(atob(shared));
          toast.success(`Loaded a shared cart with ${decoded.length} item(s)!`);
        } catch {
          toast.error('Invalid shared cart link');
        }
      }
    }
  }, []);

  // ── Fetch recommendations
  useEffect(() => {
    if (isMounted) {
      setLoadingRecs(true);
      getProducts({ sortBy: 'bestseller', limit: 4 })
        .then((products) => {
          const filtered = products.filter(
            p => !cartItems.find(c => c._id === p._id)
          );
          setRecommendations(filtered.slice(0, 4));
        })
        .catch(() => setRecommendations([]))
        .finally(() => setLoadingRecs(false));
    }
  }, [isMounted, cartItems]);

  // ── Calculations
  const subtotal  = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalFiber = cartItems.reduce((acc, item) => {
    const fiber = item.nutritionalInfo?.dietaryFiber || 4.85;
    return acc + (fiber * item.qty * (item.netWeight || 80) / 100);
  }, 0);
  const discount    = promoApplied ? subtotal * 0.1 : 0;
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
  const tax         = (subtotal - discount) * 0.05;
  const total       = subtotal - discount + tax + shippingCost;

  // ── Free Shipping Progress
  const shippingProgress          = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping  = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  // ── Quantity Change
  const debounceTimers = {};
  const handleQuantityChange = useCallback((id, delta, currentQty, stock) => {
    if (debounceTimers[id]) clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(() => {
      const newQty = currentQty + delta;
      if (newQty < 1) return;
      if (newQty > stock) {
        toast.error(`Only ${stock} items available in stock`);
        return;
      }
      dispatch(updateQuantity({ id, qty: newQty }));
    }, 300);
  }, [dispatch]);

  // ── Save for Later
  const handleSaveForLater = (item) => {
    const alreadyInWishlist = wishlistItems.find(i => i._id === item._id);
    dispatch(removeFromCart(item._id));
    if (!alreadyInWishlist) {
      dispatch(addToWishlist(item));
      toast.success(`${item.name} saved to wishlist!`);
    } else {
      toast(`${item.name} removed from cart (already in wishlist)`);
    }
  };

  // ── Remove with Undo
  const handleRemoveItem = (id, name) => {
    const removedItem = cartItems.find((item) => item._id === id);
    dispatch(removeFromCart(id));
    toast(
      (t) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>🗑️ <strong>{name}</strong> removed</span>
          <button
            onClick={() => {
              dispatch(addToCart(removedItem));
              toast.dismiss(t.id);
              toast.success(`${name} added back!`);
            }}
            style={{
              background: '#4CAF50', color: '#fff', border: 'none',
              borderRadius: '4px', padding: '4px 10px',
              cursor: 'pointer', fontWeight: 'bold',
            }}
          >
            Undo
          </button>
        </span>
      ),
      { duration: 5000 }
    );
  };

  // ── Delivery Date Estimate
  const getEstimatedDelivery = () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long', month: 'short', day: 'numeric',
    });
  };

  // ── Share Cart
  const handleShareCart = async () => {
    const cartData  = cartItems.map((item) => ({ id: item._id, qty: item.qty }));
    const encoded   = btoa(JSON.stringify(cartData));
    const shareUrl  = `${window.location.origin}/cart?shared=${encoded}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Check out my cart!', text: `Total: ₹${total.toFixed(2)}`, url: shareUrl }); }
      catch { }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Cart link copied to clipboard! 🔗');
    }
  };

 const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'WINDIA10') {
      setPromoApplied(true);
      toast.success('Promo code applied! 10% off');
    } else {
      toast.error('Invalid promo code');
    }
  };

  // ── Checkout (no pincode required)
  const handleCheckout = () => {
    if (cartItems.length === 0) { toast.error('Your cart is empty!'); return; }
    const outOfStock = cartItems.filter(item => item.qty > item.countInStock);
    if (outOfStock.length > 0) {
      toast.error(`${outOfStock[0].name} has only ${outOfStock[0].countInStock} left.`);
      return;
    }
    toast.success('Redirecting to checkout...');
    router.push('/checkout');
  };

  // ── Skeleton
  if (!isMounted) {
    return (
      <div className="cart-page">
        <div className="cart-hero" style={{ minHeight: 220 }} />
        <div className="container">
          <div className="cart-skeleton">
            <div className="skeleton skeleton-banner" />
            <div className="skeleton skeleton-item" />
            <div className="skeleton skeleton-item" />
          </div>
        </div>
      </div>
    );
  }

  // ── Empty Cart
  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        {/* Hero */}
        <section className="cart-hero">
          <div className="cart-hero-inner">
            <motion.div className="cart-hero-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <FiShoppingCart />
            </motion.div>
            <motion.h1 className="cart-hero-title" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              Your <span>Cart</span>
            </motion.h1>
          </div>
        </section>

        <div className="container cart-body">
          <motion.div className="cart-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="empty-icon"><FiShoppingCart /></div>
            <h2>Your Cart is Empty</h2>
            <p>Add some delicious khakhra things to get started!</p>
            <Link href="/shop" className="btn btn-primary">Explore Things <FiArrowRight /></Link>
          </motion.div>

          <motion.div className="recommendations" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 className="recommendations-title">✨ You Might Like</h3>
            {loadingRecs ? (
              <div className="recommendations-grid">
                {[1,2,3,4].map(i => <div key={i} className="skeleton rec-skeleton" />)}
              </div>
            ) : (
              <div className="recommendations-grid">
                {recommendations.map((product) => (
                  <motion.div key={product._id} className="rec-card" whileHover={{ y: -4 }}>
                    <Link href={`/product/${product._id}`}>
                      <img src={product.image} alt={product.name} loading="lazy" />
                      <div className="rec-info">
                        <p className="rec-name">{product.name}</p>
                        <p className="rec-price">₹{product.price}</p>
                      </div>
                    </Link>
                    <button className="rec-add-btn" onClick={() => { dispatch(addToCart({ ...product, qty: 1 })); toast.success(`${product.name} added to cart!`); }}>
                      Add to Cart
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">

      {/* ══ CART HERO ══ */}
      <section className="cart-hero">
        <div className="cart-hero-inner">
          <motion.div
            className="cart-hero-icon"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <FiShoppingCart />
          </motion.div>

          <motion.h1
            className="cart-hero-title"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Shopping <span>Cart</span>
          </motion.h1>

          <motion.div
            className="cart-hero-meta"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="cart-hero-badge">
              <FiPackage /> {cartItems.length} Item{cartItems.length !== 1 ? 's' : ''}
            </span>
            <span className="cart-hero-badge">
              <FiTruck /> Free shipping on ₹499+
            </span>
            <button className="btn-share-cart" onClick={handleShareCart}>
              <FiShare2 /> <span>Share Cart</span>
            </button>
          </motion.div>
        </div>
      </section>

      <div className="container cart-body">

        {/* Free Shipping Progress */}
        <motion.div className="shipping-progress-wrapper" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {remainingForFreeShipping > 0 ? (
            <>
              <p className="shipping-progress-text">
                🚚 Add <strong>₹{remainingForFreeShipping.toFixed(0)}</strong> more for <strong>FREE shipping!</strong>
              </p>
              <div className="shipping-progress-bar">
                <motion.div className="shipping-progress-fill" initial={{ width: 0 }} animate={{ width: `${shippingProgress}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
              </div>
            </>
          ) : (
            <p className="shipping-progress-achieved">🎉 You've unlocked <strong>FREE shipping!</strong></p>
          )}
        </motion.div>

        {/* Delivery Estimate */}
        <motion.div className="delivery-estimate-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <FiClock />
          <span>Order now — estimated delivery by <strong>{getEstimatedDelivery()}</strong></span>
        </motion.div>

        <div className="cart-layout">

          {/* ══ CART ITEMS ══ */}
          <motion.div className="cart-items" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>

            {/* Fiber Tracker */}
            <div className="fiber-tracker-banner">
              <div className="fiber-icon">🌿</div>
              <div className="fiber-content">
                <span className="fiber-label">Total Fiber in Cart</span>
                <span className="fiber-value">{totalFiber.toFixed(1)}g</span>
                <span className="fiber-desc">Supports your daily fiber goal!</span>
              </div>
            </div>

            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div
                  key={item._id}
                  className="cart-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  whileHover={{ y: -2 }}
                >
                  <Link href={`/product/${item._id}`} className="item-image">
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </Link>

                  <div className="item-details">
                    <Link href={`/product/${item._id}`} className="item-name">{item.name}</Link>
                    <p className="item-description">{item.shortDescription}</p>
                    <div className="item-badges">
                      {item.isLowGI      && <span className="badge low-gi">Low GI</span>}
                      {item.isGlutenFree && <span className="badge gluten-free">Gluten Free</span>}
                      {item.countInStock <= 3 && (
                        <span className="badge stock-warning"><FiAlertTriangle /> Only {item.countInStock} left!</span>
                      )}
                    </div>
                    <div className="item-price">
                      <span className="current-price">₹{item.price}</span>
                      {item.originalPrice > item.price && <span className="original-price">₹{item.originalPrice}</span>}
                    </div>
                    <button className="save-for-later-btn" onClick={() => handleSaveForLater(item)}>
                      <FiHeart /> Save for Later
                    </button>
                    {wishlistItems.find(i => i._id === item._id) && (
                      <span style={{ fontSize: '0.75rem', color: '#4CAF50' }}>✔ Saved</span>
                    )}
                  </div>

                  <div className="item-quantity">
                    <button className="qty-btn" onClick={() => handleQuantityChange(item._id, -1, item.qty, item.countInStock)}><FiMinus /></button>
                    <span className="qty-value">{item.qty}</span>
                    <button className="qty-btn" onClick={() => handleQuantityChange(item._id, 1, item.qty, item.countInStock)}><FiPlus /></button>
                  </div>

                  <div className="item-total">
                    <span className="total-label">Total</span>
                    <span className="total-value">₹{(item.price * item.qty).toFixed(2)}</span>
                  </div>

                  <button className="item-remove" onClick={() => handleRemoveItem(item._id, item.name)}><FiTrash2 /></button>
                </motion.div>
              ))}
            </AnimatePresence>

            <Link href="/shop" className="continue-shopping-link">
              <FiArrowLeft /> Continue Shopping
            </Link>
          </motion.div>

          {/* ══ ORDER SUMMARY ══ */}
          <motion.div className="cart-summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="summary-card">
              <h3>Order Summary</h3>

              {/* Itemized list */}
              <div className="summary-items-list">
                {cartItems.map((item) => (
                  <div key={item._id} className="summary-item-row">
                    <div>
                      <div className="summary-item-name">{item.name}</div>
                      <div className="summary-item-qty">Qty: {item.qty} × ₹{item.price}</div>
                    </div>
                    <span className="summary-item-price">₹{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="summary-row">
                <span>Subtotal ({cartItems.reduce((a, i) => a + i.qty, 0)} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Promo Section */}
              <div className="promo-section">
                <div style={{ marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#666' }}>Have a code? Try: </span>
                  <span
                    style={{ color: '#E65100', cursor: 'pointer', fontWeight: '700' }}
                    onClick={() => { setPromoCode('WINDIA10'); toast('Code filled! Click Apply', { icon: '🏷️' }); }}
                  >
                    WINDIA10
                  </span>
                </div>
                <div className="promo-input-wrapper">
                  <FiTag className="promo-icon" />
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                  />
                  {!promoApplied
                    ? <button onClick={handleApplyPromo}>Apply</button>
                    : <button className="applied" disabled>✓ Applied</button>
                  }
                </div>
                {promoApplied && (
                  <div className="promo-applied-message">
                    <FiPercent /> WINDIA10 — 10% discount applied!
                  </div>
                )}
              </div>

              {/* Discount row */}
              {promoApplied && (
                <div className="summary-row discount">
                  <span>🏷️ Discount (WINDIA10 — 10%)</span>
                  <span>−₹{discount.toFixed(2)}</span>
                </div>
              )}

              <hr className="summary-divider" />

              {/* Shipping */}
              <div className="summary-row shipping-row">
                <span>🚚 Shipping</span>
                <span style={{ color: shippingCost === 0 ? 'var(--win-dia-success)' : 'inherit', fontWeight: shippingCost === 0 ? 700 : 500 }}>
                  {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                </span>
              </div>

              {/* Tax */}
              <div className="summary-row tax-row">
                <span>🧾 GST / Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>

              <hr className="summary-divider" />

              {/* Grand Total */}
              <div className="summary-total">
                <span>Grand Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <button className="btn-checkout" onClick={handleCheckout}>
                Proceed to Checkout <FiArrowRight />
              </button>

              <div className="trust-badges">
                <div className="trust-item"><FiShield /> Secure Checkout</div>
                <div className="trust-item"><FiTruck /> Free Shipping ₹499+</div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div className="recommendations" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 className="recommendations-title">✨ You Might Also Like</h3>
            <div className="recommendations-grid">
              {recommendations.map((product) => (
                <motion.div key={product._id} className="rec-card" whileHover={{ y: -4 }}>
                  <Link href={`/product/${product._id}`}>
                    <img src={product.image} alt={product.name} loading="lazy" />
                    <div className="rec-info">
                      <p className="rec-name">{product.name}</p>
                      <p className="rec-price">₹{product.price}</p>
                    </div>
                  </Link>
                  <button className="rec-add-btn" onClick={() => { dispatch(addToCart({ ...product, qty: 1 })); toast.success(`${product.name} added!`); }}>
                    + Add to Cart
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile Sticky Bar */}
      <div className="mobile-checkout-bar">
        <div className="mobile-checkout-total">
          <span className="mobile-total-label">Total</span>
          <span className="mobile-total-value">₹{total.toFixed(2)}</span>
        </div>
        <button className="mobile-checkout-btn" onClick={handleCheckout}>
          Checkout <FiArrowRight />
        </button>
      </div>
    </div>
  );
};

export default Cart;