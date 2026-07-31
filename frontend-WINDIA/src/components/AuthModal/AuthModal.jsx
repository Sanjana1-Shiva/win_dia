'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiUser, FiHeart } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import './AuthModal.css';

/**
 * Shared "Please Login or Register" popup.
 * Used anywhere a guest tries a gated action: wishlist, add to cart,
 * checkout, buy now, or leaving a review.
 *
 * Usage:
 *   const [showAuthModal, setShowAuthModal] = useState(false);
 *   if (!user) { setShowAuthModal(true); return; }
 *   ...
 *   <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
 */
const AuthModal = ({ open, onClose, message, nextPath }) => {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const goTo = (path) => {
    const next = nextPath || (typeof window !== 'undefined' ? window.location.pathname : '/');
    onClose?.();
    router.push(`${path}?next=${encodeURIComponent(next)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="auth-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="auth-modal-close" onClick={onClose} aria-label="Close">
              <FiX />
            </button>

            <div className="auth-modal-icon">
              <FiHeart />
            </div>

            <h3 id="auth-modal-title" className="auth-modal-title">
              Please Login or Register
            </h3>
            <p className="auth-modal-desc">
              {message || 'Sign in to continue — save your cart, track orders, and unlock your wishlist.'}
            </p>

            <div className="auth-modal-actions">
              <button className="auth-modal-btn auth-modal-btn--primary" onClick={() => goTo('/login')}>
                <FiUser /> Login
              </button>
              <button className="auth-modal-btn auth-modal-btn--secondary" onClick={() => goTo('/register')}>
                Create Account
              </button>
            </div>

            <button className="auth-modal-dismiss" onClick={onClose}>
              Continue Browsing
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
