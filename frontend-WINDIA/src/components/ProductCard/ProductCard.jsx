'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiHeart, FiCheck, FiStar } from 'react-icons/fi';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist, removeFromWishlist } from '../../redux/slices/wishlistSlice';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import AuthModal from '../AuthModal/AuthModal';
import './ProductCard.css';

const ProductCard = ({ product, index }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { wishlistItems } = useSelector((state) => state.wishlist);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const productId = product._id || product.id;
  const isInWishlist = wishlistItems.some((item) => item._id === productId || item.id === productId);
  const productImage = product.image || '/images/windia-logo.png';
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const requireLogin = () => setShowAuthModal(true);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { requireLogin(); return; }
    dispatch(addToCart(product));
    toast.success(`${product.name} added to cart!`, {
      icon: '🛒',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { requireLogin(); return; }
    if (isInWishlist) {
      dispatch(removeFromWishlist(productId));
      toast.success('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product));
      toast.success('Added to wishlist!', {
        icon: '❤️',
      });
    }
  };

  return (
    <div
      className="product-card fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <Link href={`/product/${productId}`} className="product-card-link">
        <div className="product-image-wrapper">
          <img 
  src={productImage} 
  alt={product.name} 
  className="product-image" 
/>
          {product.count_in_stock > 0 ? (
            <span className="stock-badge in-stock">
              <FiCheck /> In Stock
            </span>
          ) : (
            <span className="stock-badge out-of-stock">Out of Stock</span>
          )}
          {discountPercent > 0 && (
            <span className="discount-badge">{discountPercent}% OFF</span>
          )}
          <button
            className="wishlist-btn"
            onClick={handleWishlist}
            aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isInWishlist}
          >
            <FiHeart className={isInWishlist ? 'active' : ''} />
          </button>
        </div>

        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          {product.ratingCount > 0 && (
            <div className="product-rating">
              <FiStar className="rating-star" />
              <span className="rating-value">{product.ratingAvg.toFixed(1)}</span>
              <span className="rating-count">({product.ratingCount})</span>
            </div>
          )}
          <p className="product-description">{product.shortDescription}</p>

          <div className="product-meta">
            <div className="product-price">
              <span className="current-price">₹{product.price}</span>
              {product.originalPrice && (
                <span className="original-price">₹{product.originalPrice}</span>
              )}
            </div>

            
          </div>

          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={product.count_in_stock === 0}
          >
            <FiShoppingCart />
            {product.count_in_stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </Link>
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={`Sign in to add ${product.name} to your cart or wishlist.`}
      />
    </div>
  );
};

export default ProductCard;