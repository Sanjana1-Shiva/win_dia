'use client';

import React, { useState } from 'react';
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
  FiMapPin
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { saveShippingAddress, savePaymentMethod } from '../../../redux/slices/cartSlice';
import { createOrder } from '../../../redux/actions/orderActions';
import toast from 'react-hot-toast';
import './Checkout.css';

const Checkout = () => {
  const dispatch = useDispatch();
  const router   = useRouter();
  const { cartItems, shippingAddress } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.user);

  // Read whether promo was already applied in the Cart page
  // We pass this via Redux cart state or localStorage
  const cartPromoApplied = useSelector((state) => state.cart.promoApplied) ?? false;

  const [currentStep,       setCurrentStep]       = useState(1);
  const [showAddressForm,   setShowAddressForm]    = useState(false);
  const [selectedAddress,   setSelectedAddress]    = useState(shippingAddress?._id || null);
  const [paymentMethod,     setPaymentMethod]      = useState('razorpay');
  const [orderNotes,        setOrderNotes]         = useState('');
  const [selectedDelivery,  setSelectedDelivery]   = useState('standard');

  // Coupon — synced from cart
  const [couponCode,        setCouponCode]         = useState(cartPromoApplied ? 'WINDIA10' : '');
  const [couponApplied,     setCouponApplied]      = useState(cartPromoApplied);
  const [showCouponInput,   setShowCouponInput]    = useState(false);

  const [addresses, setAddresses] = useState([
    {
      _id: '1',
      type: 'home',
      name: 'Smt. G. Tejaswini',
      street: 'Basavanahalli Main Road, Beside Sharmada Resort',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570032',
      phone: '+91 96861 53413',
      isDefault: true
    },
    {
      _id: '2',
      type: 'office',
      name: 'WIN-DIA Office',
      street: 'Vijayanagar 4th Stage, Industrial Area',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570032',
      phone: '+91 82145 27307',
      isDefault: false
    }
  ]);

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

  const handleAddAddress = () => {
    const address = { ...newAddress, _id: Date.now().toString() };
    setAddresses([...addresses, address]);
    setSelectedAddress(address._id);
    setShowAddressForm(false);
    setNewAddress({ type: 'home', name: '', street: '', city: '', state: 'Karnataka', pincode: '', phone: '', isDefault: false });
    toast.success('Address added successfully!');
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

  const handlePlaceOrder = () => {
    dispatch(savePaymentMethod(paymentMethod));
    const orderData = {
      orderItems: cartItems,
      shippingAddress: addresses.find(addr => addr._id === selectedAddress),
      paymentMethod,
      itemsPrice:    subtotal,
      taxPrice:      tax,
      shippingPrice: deliveryOptions.find(d => d.id === selectedDelivery)?.cost || shippingCost,
      totalPrice:    total + (selectedDelivery === 'express' ? 100 : 0),
    };
    dispatch(createOrder(orderData));
    toast.success('Order placed successfully!');
    router.push('/order-confirmation');
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
                    <button className="btn-proceed" onClick={handlePlaceOrder}>Place Order <FiChevronRight /></button>
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

              {/* ── SMART COUPON SECTION ── */}
              <div className="coupon-section">
                {couponApplied ? (
                  /* Already applied — show green banner, no input */
                  <motion.div className="coupon-applied-banner" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="coupon-applied-icon"><FiCheck /></div>
                    <div className="coupon-applied-text">
                      <strong>WINDIA10 Applied!</strong>
                      <span>10% discount is active on your order</span>
                    </div>
                  </motion.div>
                ) : (
                  /* Not applied — show small toggle button, expand on click */
                  <>
                    {!showCouponInput ? (
                      <button className="coupon-toggle-btn" onClick={() => setShowCouponInput(true)}>
                        <FiTag /> Have a coupon code?
                      </button>
                    ) : (
                      <motion.div className="coupon-input-wrapper" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                        <FiTag className="coupon-icon" />
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          autoFocus
                        />
                        <button onClick={handleApplyCoupon}>Apply</button>
                      </motion.div>
                    )}
                  </>
                )}
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