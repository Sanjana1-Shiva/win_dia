'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiCheck,
  FiPlus,
  FiEdit3,
  FiTruck,
  FiPackage,
  FiShield,
  FiClock,
  FiCreditCard,
  FiGlobe,
  FiTag,
  FiChevronRight,
  FiHome,
  FiBriefcase,
  FiMapPin,
  FiLoader
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { saveShippingAddress, savePaymentMethod, clearCart } from '../../../redux/slices/cartSlice';
import { useAuth } from '@/hooks/useAuth';
import { validateAddress } from '@/src/lib/validation';
import toast from 'react-hot-toast';
import './Checkout.css';

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`)) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Checkout = () => {
  const dispatch = useDispatch();
  const router   = useRouter();
  const { cartItems, shippingAddress } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.user);
  const { user: authUser, authFetch } = useAuth();

  // Read whether promo was already applied in the Cart page
  // We pass this via Redux cart state or localStorage
  const cartPromoApplied = useSelector((state) => state.cart.promoApplied) ?? false;

  const [currentStep,       setCurrentStep]       = useState(1);
  const [showAddressForm,   setShowAddressForm]    = useState(false);
  const [selectedAddress,   setSelectedAddress]    = useState(shippingAddress?._id || null);
  const [paymentMethod,     setPaymentMethod]      = useState('razorpay');
  const [orderNotes,        setOrderNotes]         = useState('');
  const [selectedDelivery,  setSelectedDelivery]   = useState('standard');
  const [placingOrder,      setPlacingOrder]       = useState(false);

  // Coupon — synced from cart
  const [couponCode,        setCouponCode]         = useState(cartPromoApplied ? 'WINDIA10' : '');
  const [couponApplied,     setCouponApplied]      = useState(cartPromoApplied);
  const [showCouponInput,   setShowCouponInput]    = useState(false);

  const [addresses, setAddresses]         = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressFormErrors, setAddressFormErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function loadAddresses() {
      if (!authUser) { setLoadingAddresses(false); return; }
      try {
        const res = await authFetch('/api/addresses');
        const data = await res.json();
        if (!cancelled && data.success) {
          const normalized = (data.addresses || []).map((a) => ({ ...a, _id: a.id, isDefault: a.is_default }));
          setAddresses(normalized);
          const defaultAddr = normalized.find((a) => a.isDefault) || normalized[0];
          if (defaultAddr) setSelectedAddress(defaultAddr._id);
        }
      } catch {
        toast.error('Could not load saved addresses');
      } finally {
        if (!cancelled) setLoadingAddresses(false);
      }
    }
    loadAddresses();
    return () => { cancelled = true; };
  }, [authUser]);

  const [newAddress, setNewAddress] = useState({
    type: 'home', name: '', street: '', city: '',
    state: 'Karnataka', pincode: '', phone: '', isDefault: false
  });

  // ── Calculations
  const subtotal     = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalFiber   = cartItems.reduce((acc, item) => {
    const fiber = item.nutritionalInfo?.dietaryFiber || 4.85;
    return acc + (fiber * item.qty * (item.netWeight || 80) / 100);
  }, 0);
  const discount     = couponApplied ? subtotal * 0.1 : 0;
  const shippingCost = subtotal >= 499 ? 0 : 50;
  const tax          = (subtotal - discount) * 0.05;
  const total        = subtotal - discount + tax + shippingCost;

  const paymentMethods = [
    { id: 'razorpay', name: 'Razorpay',          icon: FiCreditCard, description: 'Cards, UPI, NetBanking, Wallet' },
    { id: 'cod',      name: 'Cash on Delivery',   icon: FiPackage,    description: 'Pay when you receive'          }
  ];

  const deliveryOptions = [
    { id: 'standard', name: 'Standard Delivery', time: '3–5 business days', cost: shippingCost,       icon: FiTruck },
    { id: 'express',  name: 'Express Delivery',  time: '1–2 business days', cost: shippingCost + 100, icon: FiClock }
  ];

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case 'home':   return FiHome;
      case 'office': return FiBriefcase;
      default:       return FiMapPin;
    }
  };

  const handleAddAddress = async () => {
    const errors = validateAddress(newAddress);
    setAddressFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    try {
      const res = await authFetch('/api/addresses', { method: 'POST', body: JSON.stringify(newAddress) });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || 'Could not save address');
        return;
      }
      const saved = { ...data.address, _id: data.address.id, isDefault: data.address.is_default };
      setAddresses((prev) => [saved, ...(newAddress.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev)]);
      setSelectedAddress(saved._id);
      setShowAddressForm(false);
      setAddressFormErrors({});
      setNewAddress({ type: 'home', name: '', street: '', city: '', state: 'Karnataka', pincode: '', phone: '', isDefault: false });
      toast.success('Address added successfully!');
    } catch {
      toast.error('Could not save address. Please try again.');
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WINDIA10') {
      setCouponApplied(true);
      setShowCouponInput(false);
      toast.success('Coupon applied! 10% off');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    const address = addresses.find(addr => addr._id === selectedAddress);
    dispatch(saveShippingAddress(address));
    setCurrentStep(2);
  };

  const handlePlaceOrder = async () => {
    if (placingOrder) return;
    const address = addresses.find((a) => a._id === selectedAddress);
    if (!address) { toast.error('Please select a delivery address'); return; }

    setPlacingOrder(true);
    dispatch(savePaymentMethod(paymentMethod));

    try {
      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cartItems.map((item) => ({ productId: item._id || item.id, qty: item.qty, flavor: item.flavor })),
          shippingAddress: {
            name: address.name, phone: address.phone, street: address.street,
            city: address.city, state: address.state, pincode: address.pincode,
          },
          paymentMethod,
          orderNotes,
          deliverySpeed: selectedDelivery,
          couponCode: couponApplied ? couponCode : null,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || 'Could not place order');
        setPlacingOrder(false);
        return;
      }

      if (!data.requiresPayment) {
        dispatch(clearCart());
        toast.success('Order placed successfully!');
        router.push(`/order-confirmation?orderId=${data.order.id}`);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Could not load payment gateway. Check your connection and try again.');
        setPlacingOrder(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.razorpay.keyId,
        amount: data.razorpay.amount,
        currency: data.razorpay.currency,
        order_id: data.razorpay.orderId,
        name: 'WIN-DIA',
        description: `Order ${data.order.order_number}`,
        prefill: { name: address.name, contact: address.phone },
        theme: { color: '#c56a3d' },
        handler: async (response) => {
          try {
            const verifyRes = await authFetch('/api/payment/verify', {
              method: 'POST',
              body: JSON.stringify({
                orderId: data.order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              dispatch(clearCart());
              toast.success('Payment successful! Order confirmed.');
              router.push(`/order-confirmation?orderId=${data.order.id}`);
            } else {
              toast.error(verifyData.error || 'Payment verification failed. Contact support if money was deducted.');
            }
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
            toast('Payment cancelled', { icon: 'ℹ️' });
          },
        },
      });

      rzp.on('payment.failed', () => {
        setPlacingOrder(false);
        toast.error('Payment failed. Please try again.');
      });

      rzp.open();
    } catch (err) {
      toast.error('Something went wrong placing your order. Please try again.');
      setPlacingOrder(false);
    }
  };

  // ── Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <section className="checkout-hero">
          <div className="checkout-hero-inner">
            <Link href="/cart" className="back-link"><FiArrowLeft /> Back to Cart</Link>
            <h1 className="checkout-hero-title">Check<span>out</span></h1>
          </div>
        </section>
        <div className="container checkout-body">
          <motion.div className="checkout-empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="empty-icon"><FiPackage /></div>
            <h2>Your Cart is Empty</h2>
            <p>Add some delicious khakhra things to get started!</p>
            <Link href="/shop" className="btn btn-primary">Explore Things <FiArrowLeft /></Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      {/* ══ CHECKOUT HERO ══ */}
      <section className="checkout-hero">
        <div className="checkout-hero-inner">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/cart" className="back-link">
              <FiArrowLeft /> Back to Cart
            </Link>
          </motion.div>

          <motion.h1
            className="checkout-hero-title"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Secure <span>Checkout</span>
          </motion.h1>

          {/* Progress Steps */}
          <motion.div
            className="checkout-steps"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <span className="step-number">{currentStep > 1 ? <FiCheck /> : '1'}</span>
              <span className="step-label">Shipping</span>
            </div>
            <div className="step-line" />
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Payment</span>
            </div>
            <div className="step-line" />
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Confirm</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container checkout-body">
        <div className="checkout-layout">

          {/* ══ MAIN CONTENT ══ */}
          <motion.div className="checkout-main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <AnimatePresence mode="wait">

              {/* Step 1: Shipping */}
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="checkout-section">
                  <div className="section-header">
                    <h2>Delivery Address</h2>
                    {!showAddressForm && (
                      <button className="btn-add-address" onClick={() => setShowAddressForm(true)}>
                        <FiPlus /> Add New Address
                      </button>
                    )}
                  </div>

                  {/* Address Form */}
                  {showAddressForm && (
                    <motion.div className="address-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Address Type</label>
                          <div className="address-type-selector">
                            <button className={`type-btn ${newAddress.type === 'home' ? 'active' : ''}`} onClick={() => setNewAddress({ ...newAddress, type: 'home' })}><FiHome /> Home</button>
                            <button className={`type-btn ${newAddress.type === 'office' ? 'active' : ''}`} onClick={() => setNewAddress({ ...newAddress, type: 'office' })}><FiBriefcase /> Office</button>
                          </div>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Full Name</label>
                          <input type="text" placeholder="Enter your full name" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input type="tel" placeholder="10-digit mobile number" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Street Address</label>
                        <textarea placeholder="House/Flat No., Street, Landmark" value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} rows="2" />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>City</label>
                          <input type="text" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>State</label>
                          <select value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Delhi">Delhi</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Pincode</label>
                          <input type="text" placeholder="6-digit pincode" maxLength="6" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} />
                        </div>
                      </div>
                      <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                          <input type="checkbox" checked={newAddress.isDefault} onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })} />
                          <span className="checkbox-custom" />
                          <span>Set as default address</span>
                        </label>
                      </div>
                      <div className="form-actions">
                        <button className="btn-cancel" onClick={() => setShowAddressForm(false)}>Cancel</button>
                        <button className="btn-save" onClick={handleAddAddress}>Save Address</button>
                      </div>
                    </motion.div>
                  )}

                  {/* Saved Addresses */}
                  {!showAddressForm && (
                    <div className="addresses-list">
                      {addresses.map((address) => {
                        const TypeIcon = getAddressTypeIcon(address.type);
                        return (
                          <motion.div
                            key={address._id}
                            className={`address-card ${selectedAddress === address._id ? 'selected' : ''}`}
                            onClick={() => setSelectedAddress(address._id)}
                            whileHover={{ y: -2 }}
                          >
                            <div className="address-radio">
                              <span className={`radio-custom ${selectedAddress === address._id ? 'checked' : ''}`}>
                                {selectedAddress === address._id && <FiCheck />}
                              </span>
                            </div>
                            <div className="address-content">
                              <div className="address-header">
                                <span className="address-type">
                                  <TypeIcon /> {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                                </span>
                                {address.isDefault && <span className="default-badge">Default</span>}
                              </div>
                              <div className="address-details">
                                <p className="address-name">{address.name}</p>
                                <p>{address.street}</p>
                                <p>{address.city}, {address.state} — {address.pincode}</p>
                                <p className="address-phone">{address.phone}</p>
                              </div>
                              <button className="btn-edit-address" onClick={(e) => e.stopPropagation()}>
                                <FiEdit3 /> Edit
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Order Notes */}
                  <div className="order-notes-section">
                    <label>Order Notes (Optional)</label>
                    <textarea placeholder="Any special instructions for delivery..." value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows="2" />
                  </div>

                  <div className="section-footer">
                    <button className="btn-proceed" onClick={handleProceedToPayment} disabled={!selectedAddress}>
                      Proceed to Payment <FiChevronRight />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="checkout-section">
                  <div className="section-header">
                    <h2>Payment Method</h2>
                  </div>

                  <div className="delivery-section">
                    <h3>Delivery Options</h3>
                    <div className="delivery-options">
                      {deliveryOptions.map((option) => {
                        const OptionIcon = option.icon;
                        return (
                          <motion.div key={option.id} className={`delivery-card ${selectedDelivery === option.id ? 'selected' : ''}`} onClick={() => setSelectedDelivery(option.id)} whileHover={{ y: -2 }}>
                            <div className="delivery-radio">
                              <span className={`radio-custom ${selectedDelivery === option.id ? 'checked' : ''}`}>
                                {selectedDelivery === option.id && <FiCheck />}
                              </span>
                            </div>
                            <div className="delivery-content">
                              <div className="delivery-header"><OptionIcon /><span className="delivery-name">{option.name}</span></div>
                              <p className="delivery-time">{option.time}</p>
                              <p className="delivery-cost">{option.cost === 0 ? 'FREE' : `₹${option.cost}`}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="payment-section">
                    <h3>Choose Payment Method</h3>
                    <div className="payment-methods">
                      {paymentMethods.map((method) => {
                        const MethodIcon = method.icon;
                        return (
                          <motion.div key={method.id} className={`payment-card ${paymentMethod === method.id ? 'selected' : ''}`} onClick={() => setPaymentMethod(method.id)} whileHover={{ y: -2 }}>
                            <div className="payment-radio">
                              <span className={`radio-custom ${paymentMethod === method.id ? 'checked' : ''}`}>
                                {paymentMethod === method.id && <FiCheck />}
                              </span>
                            </div>
                            <div className="payment-content">
                              <div className="payment-header"><MethodIcon /><span className="payment-name">{method.name}</span></div>
                              <p className="payment-description">{method.description}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="security-notice">
                    <FiShield /> Your payment information is secure and encrypted
                  </div>

                  <div className="section-footer">
                    <button className="btn-back" onClick={() => setCurrentStep(1)}><FiArrowLeft /> Back</button>
                    <button className="btn-proceed" onClick={handlePlaceOrder} disabled={placingOrder}>
                      {placingOrder ? (<><FiLoader className="wd-spin" /> Placing Order...</>) : (<>Place Order <FiChevronRight /></>)}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* ══ ORDER SUMMARY SIDEBAR ══ */}
          <motion.div className="checkout-sidebar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="summary-card">
              <h3>Order Summary</h3>

              {/* Fiber Tracker */}
              <div className="fiber-tracker-mini">
                <div className="fiber-icon">💪</div>
                <div className="fiber-info">
                  <span className="fiber-value">{totalFiber.toFixed(1)}g Fiber</span>
                  <span className="fiber-label">in your order</span>
                </div>
              </div>

              {/* Order Items */}
              <div className="order-items-mini">
                <div className="items-header">
                  <span>Items ({cartItems.length})</span>
                  <button onClick={() => router.push('/cart')}>Edit</button>
                </div>
                <div className="items-list">
                  {cartItems.map((item) => (
                    <div key={item._id} className="mini-item">
                      <div className="item-image">
                        <img src={item.image} alt={item.name} />
                        <span className="item-qty">{item.qty}</span>
                      </div>
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">₹{item.price * item.qty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              

              {/* Price Breakdown */}
              <div className="price-breakdown">
                <div className="breakdown-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {couponApplied && (
                  <div className="breakdown-row discount">
                    <span>🏷️ Discount (WINDIA10 — 10%)</span>
                    <span>−₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="breakdown-row">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? 'free' : ''}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                </div>
                <div className="breakdown-row">
                  <span>Tax (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <div className="summary-trust">
                <div className="trust-item"><FiShield /> Secure Checkout</div>
                <div className="trust-item"><FiTruck /> Free Shipping over ₹499</div>
                <div className="trust-item"><FiGlobe /> PAN India Delivery</div>
              </div>
            </div>

            {/* Delivering to */}
            {selectedAddress && currentStep === 2 && (
              <div className="selected-address-summary">
                <h4>Delivering to</h4>
                <div className="address-summary-content">
                  <p className="address-name">{addresses.find(a => a._id === selectedAddress)?.name}</p>
                  <p>{addresses.find(a => a._id === selectedAddress)?.street}</p>
                  <p>{addresses.find(a => a._id === selectedAddress)?.city}, {addresses.find(a => a._id === selectedAddress)?.state}</p>
                  <button onClick={() => setCurrentStep(1)}>Change</button>
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;