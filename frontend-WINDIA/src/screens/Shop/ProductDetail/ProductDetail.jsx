'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FiChevronLeft,
  FiShoppingCart,
  FiHeart,
  FiStar,
  FiShield,
  FiTruck,
  FiRefreshCw,
  FiCheckCircle,
  FiZap,
} from 'react-icons/fi';
import { fetchProductDetails } from '../productActions';
import { addToCart } from '../../../redux/actions/cartActions';
import { addToWishlist, removeFromWishlist } from '../../../redux/slices/wishlistSlice';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal/AuthModal';
import { getVariantSiblings } from '../lib/products';
import './ProductDetail.css';

/* ── Read-only star rating (used for the header rating summary) ── */
const StarRating = ({ value }) => (
  <div className="star-row">
    {[1, 2, 3, 4, 5].map((star) => (
      <FiStar
        key={star}
        className={`star-icon ${value >= star ? 'filled' : ''}`}
      />
    ))}
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const { product, loading, error } = useSelector((state) => state.products);
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const isInWishlist = wishlistItems.some((item) => item._id === id);
  const { user } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [variantSiblings, setVariantSiblings] = useState([]);

  /* rating summary is still sourced from real review data, just no
     longer rendered as a full reviews section on this page */
  const [ratingSummary, setRatingSummary] = useState({ avg: 0, total: 0 });

  useEffect(() => {
    dispatch(fetchProductDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (product?.variantGroup) {
      getVariantSiblings(product.variantGroup, product._id || product.id).then(setVariantSiblings);
    } else {
      setVariantSiblings([]);
    }
  }, [product?.variantGroup, product?._id, product?.id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`/api/reviews?productId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.success) return;
        const total = d.reviews.length;
        const avg = total ? d.reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
        setRatingSummary({ avg, total });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  const requireLogin = (message) => {
    setAuthModalMessage(message);
    setShowAuthModal(true);
  };

  const onAddToCart = () => {
    if (!user) { requireLogin('Sign in to add this product to your cart.'); return; }
    if (product) {
      dispatch(addToCart(product));
      router.push('/cart');
    }
  };

  const onBuyNow = () => {
    if (!user) { requireLogin('Sign in to buy this product now.'); return; }
    if (product) {
      dispatch(addToCart(product));
      router.push('/checkout');
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    if (!user) { requireLogin('Sign in to save this product to your wishlist.'); return; }
    if (isInWishlist) {
      dispatch(removeFromWishlist(product._id));
    } else {
      dispatch(addToWishlist(product));
    }
  };

  const discountPct = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="pd-page">
      <div className="pd-container">

        {/* ── Breadcrumb / Back ── */}
        <button className="pd-back" onClick={() => router.back()}>
          <FiChevronLeft /> Back to Shop
        </button>

        {loading ? (
          <div className="pd-state">Loading product…</div>
        ) : error ? (
          <div className="pd-state pd-state-error">{error}</div>
        ) : product ? (
          <div className="pd-layout">

            {/* ══════════════ LEFT — MEDIA ══════════════ */}
            <motion.div
              className="pd-media"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <div className="pd-media-frame">
                {discountPct > 0 && (
                  <span className="pd-ribbon">{discountPct}% OFF</span>
                )}
                <button
                  className={`pd-wish-toggle ${isInWishlist ? 'active' : ''}`}
                  onClick={toggleWishlist}
                  aria-label="Toggle wishlist"
                >
                  <FiHeart />
                </button>

                <img src={product.image} alt={product.name} />

                <span className="chip-particle chip-1" />
                <span className="chip-particle chip-2" />
                <span className="chip-particle chip-3" />
                <span className="chip-particle chip-4" />
                <span className="chip-particle chip-5" />
              </div>

              <div className="pd-trust-strip">
                <div className="pd-trust-item">
                  <FiTruck /> <span>Fast Dispatch</span>
                </div>
                <div className="pd-trust-item">
                  <FiShield /> <span>Secure Payment</span>
                </div>
                <div className="pd-trust-item">
                  <FiRefreshCw /> <span>Easy Returns</span>
                </div>
              </div>
            </motion.div>

            {/* ══════════════ RIGHT — INFO ══════════════ */}
            <motion.div
              className="pd-info"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.08 }}
            >
              <span className="pd-eyebrow">Product Detail</span>
              <h1 className="pd-title">{product.name}</h1>

              <div className="pd-rating-row">
                <StarRating value={Math.round(ratingSummary.avg)} />
                <span className="pd-rating-score">{ratingSummary.avg.toFixed(1)}</span>
                <span className="pd-rating-count">
                  ({ratingSummary.total} review{ratingSummary.total === 1 ? '' : 's'})
                </span>
              </div>

              <p className="pd-tagline">{product.shortDescription}</p>

              {/* ── Price card ── */}
              <div className="pd-price-card">
                <div className="pd-price-row">
                  <span className="pd-price">₹{product.price}</span>
                  {product.originalPrice > product.price && (
                    <span className="pd-price-original">₹{product.originalPrice}</span>
                  )}
                  {discountPct > 0 && (
                    <span className="pd-discount-pill">{discountPct}% OFF</span>
                  )}
                </div>
                <p className="pd-price-note">Inclusive of all taxes</p>
              </div>

              {/* ── Dietary badges ── */}
              <div className="pd-badges">
                {product.isLowGI && <span><FiCheckCircle /> Low GI</span>}
                {product.isGlutenFree && <span><FiCheckCircle /> Gluten Free</span>}
                {product.isVegan && <span><FiCheckCircle /> Vegan</span>}
              </div>

              {/* ── Variant size switcher (unchanged) ── */}
              {variantSiblings.length > 0 && (
                <div className="pd-variant-switcher">
                  <p className="pd-variant-label">Also available in</p>
                  <div className="pd-variant-options">
                    <button className="pd-variant-btn active" disabled>
                      {product.netWeight ? `${product.netWeight}g` : 'Current'}
                    </button>
                    {variantSiblings.map((sib) => (
                      <button
                        key={sib.id}
                        className="pd-variant-btn"
                        onClick={() => router.push(`/product/${sib.id}`)}
                      >
                        {sib.net_weight ? `${sib.net_weight}g` : sib.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Description ── */}
              <div className="pd-description-card">
                <h3><FiZap /> Product Story</h3>
                <p>{product.description}</p>
              </div>

              {/* ── Actions (sticky on mobile) ── */}
              <div className="pd-actions">
                <button className="pd-btn pd-btn-buy" onClick={onBuyNow}>
                  Buy Now
                </button>
                <button className="pd-btn pd-btn-cart" onClick={onAddToCart}>
                  <FiShoppingCart /> Add to Cart
                </button>
                <button
                  className={`pd-btn pd-btn-wish ${isInWishlist ? 'active' : ''}`}
                  onClick={toggleWishlist}
                >
                  <FiHeart /> {isInWishlist ? 'Wishlisted' : 'Wishlist'}
                </button>
              </div>

              {/* ── Specification table (Amazon-style rows) ── */}
              <div className="pd-specs">
                <h3>Specifications</h3>
                <div className="pd-specs-table">
                  <div className="pd-spec-row">
                    <span className="pd-spec-key">Flavor</span>
                    <span className="pd-spec-val">{product.flavor}</span>
                  </div>
                  <div className="pd-spec-row">
                    <span className="pd-spec-key">GI Value</span>
                    <span className="pd-spec-val">{product.giValue}</span>
                  </div>
                  <div className="pd-spec-row">
                    <span className="pd-spec-key">Net Weight</span>
                    <span className="pd-spec-val">{product.netWeight}g</span>
                  </div>
                  <div className="pd-spec-row">
                    <span className="pd-spec-key">Availability</span>
                    <span className={`pd-spec-val ${product.countInStock > 0 ? 'pd-in-stock' : 'pd-out-stock'}`}>
                      {product.countInStock > 0 ? '✔ In Stock' : '✖ Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="pd-state">Product not found.</div>
        )}
      </div>

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authModalMessage}
      />
    </div>
  );
};

export default ProductDetail;