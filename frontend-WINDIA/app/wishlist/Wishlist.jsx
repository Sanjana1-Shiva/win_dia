'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { 
  FiShoppingCart, 
  FiTrash2, 
  FiShare2, 
  FiHeart,
  FiArrowRight,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { addToCart } from '../../../redux/actions/cartActions';
import { removeFromWishlist, clearWishlist } from '../../../redux/slices/wishlistSlice';
import toast from 'react-hot-toast';
import './Wishlist.css';

const Wishlist = () => {

  const [showModal, setShowModal] = useState(false);
  const [wishlistName, setWishlistName] = useState('');

  const dispatch = useDispatch();
  const { wishlistItems } = useSelector((state) => state.wishlist);

  // ✅ Fix: mount guard prevents server/client mismatch from Redux state
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const handleRemoveFromWishlist = (id, name) => {
    dispatch(removeFromWishlist(id));
    toast.success(`${name} removed from wishlist`);
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart(product, 1));
    toast.success(`${product.name} added to cart!`);
  };

  const handleMoveAllToCart = () => {
    wishlistItems.forEach((product) => {
      dispatch(addToCart(product, 1));
    });
    dispatch(clearWishlist());
    toast.success('All items moved to cart!');
  };

  const handleShareWishlist = () => {
    // ✅ Fix: window access guarded — only runs on client
    if (typeof window !== 'undefined') {
      const wishlistUrl = window.location.href;
      navigator.clipboard?.writeText(wishlistUrl);
      toast.success('Wishlist link copied to clipboard!');
    }
  };

  // ✅ Fix: don't render Redux-dependent UI until mounted
  if (!isMounted) return null;

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <motion.div
            className="wishlist-empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-icon">
              <FiHeart />
            </div>
            <h2>Your Wishlist is Empty</h2>
            <p>Save your favorite khakhra things and healthy snacks here.</p>
            <Link href="/shop" className="btn btn-primary">
              Explore Things <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">

        {/* Wishlist Header */}
        <motion.div
          className="wishlist-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="header-left">
            <h1>My Wishlist</h1>
            <span className="item-count">{wishlistItems.length} items</span>
          </div>
          <div className="header-actions">
            <button className="btn-share" onClick={handleShareWishlist}>
              <FiShare2 /> Share Wishlist
            </button>
            <button className="btn-move-all" onClick={handleMoveAllToCart}>
              <FiShoppingCart /> Move All to Cart
            </button>
            <button className="btn-create-wishlist" onClick={() => setShowModal(true)}>
              + Create New Wishlist
            </button>
          </div>
        </motion.div>
        
        {/* Wishlist Items Grid */}
        <motion.div
          className="wishlist-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence>
            {wishlistItems.map((product, index) => (
              <motion.div
                key={product._id}
                className="wishlist-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -6 }}
              >
                {/* Product Image */}
                <Link href={`/product/${product._id}`} className="card-image">
                  <img src={product.image} alt={product.name} />
                  {product.originalPrice > product.price && (
                    <span className="discount-badge">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  )}
                </Link>

                {/* Product Info */}
                <div className="card-content">
                  <Link href={`/product/${product._id}`} className="product-name">
                    {product.name}
                  </Link>

                  <p className="product-description">{product.shortDescription}</p>

                  {/* Product Badges */}
                  <div className="product-badges">
                    {product.isLowGI && <span className="badge low-gi">Low GI 44</span>}
                    {product.isGlutenFree && <span className="badge gluten-free">Gluten Free</span>}
                    {product.isVegan && <span className="badge vegan">Vegan</span>}
                  </div>

                  {/* Price */}
                  <div className="price-wrapper">
                    <span className="current-price">₹{product.price}</span>
                    {product.originalPrice > product.price && (
                      <span className="original-price">₹{product.originalPrice}</span>
                    )}
                  </div>

                  {/* Stock Status */}
                  <div className={`stock-status ${product.countInStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                    <span className="status-dot"></span>
                    {product.countInStock > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>

                  {/* Action Buttons */}
                  <div className="card-actions">
                    <button
                      className="btn-add-cart"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.countInStock === 0}
                    >
                      <FiShoppingCart /> Add to Cart
                    </button>
                    {/* ✅ Fix: stopPropagation prevents click bubbling */}
                    <button
                      className="btn-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromWishlist(product._id, product.name);
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Continue Shopping */}
        <motion.div
          className="continue-shopping"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/shop" className="continue-link">
            <FiArrowRight /> Continue Shopping
          </Link>
        </motion.div>

      </div>
      {showModal && (
  <div className="wishlist-modal-overlay">
    <div className="wishlist-modal">
      <h3>Create New Wishlist</h3>

      <input
        type="text"
        placeholder="Enter wishlist name..."
        value={wishlistName}
        onChange={(e) => setWishlistName(e.target.value)}
      />

      <div className="modal-actions">
        <button
          className="btn-cancel"
          onClick={() => setShowModal(false)}
        >
          Cancel
        </button>

        <button
          className="btn-create"
          onClick={() => {
            if (!wishlistName.trim()) {
              toast.error("Please enter a name");
              return;
            }
            toast.success(`${wishlistName} created 🎉`);
            setWishlistName('');
            setShowModal(false);
          }}
        >
          Create
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Wishlist;