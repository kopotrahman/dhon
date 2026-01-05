import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: ''
  });
  const [billingAddress, setBillingAddress] = useState({
    sameAsShipping: true,
    fullName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      const activeItems = response.data.items?.filter(item => !item.savedForLater) || [];
      
      if (activeItems.length === 0) {
        navigate('/cart');
        return;
      }
      
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const validateShipping = () => {
    const newErrors = {};
    if (!shippingAddress.fullName) newErrors.fullName = 'Full name is required';
    if (!shippingAddress.street) newErrors.street = 'Street address is required';
    if (!shippingAddress.city) newErrors.city = 'City is required';
    if (!shippingAddress.state) newErrors.state = 'State is required';
    if (!shippingAddress.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (!shippingAddress.phone) newErrors.phone = 'Phone number is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBillingChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setBillingAddress(prev => ({ ...prev, [name]: checked }));
    } else {
      setBillingAddress(prev => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
    if (step === 1 && validateShipping()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const placeOrder = async () => {
    try {
      setProcessing(true);
      
      const orderData = {
        shippingAddress,
        billingAddress: billingAddress.sameAsShipping ? { ...shippingAddress, sameAsShipping: true } : billingAddress,
        paymentMethod,
        notes
      };

      const response = await api.post('/orders', orderData);
      
      navigate('/order-success', { 
        state: { 
          orderNumber: response.data.orderNumber,
          orderId: response.data.order._id 
        } 
      });
    } catch (error) {
      console.error('Error placing order:', error);
      alert(error.response?.data?.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading checkout...</div>;
  }

  const activeItems = cart?.items?.filter(item => !item.savedForLater) || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const discount = cart?.couponDiscount || 0;
  const total = subtotal + shipping + tax - discount;

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      {/* Progress Steps */}
      <div className="checkout-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Shipping</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Payment</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Review</span>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form">
          {/* Step 1: Shipping Address */}
          {step === 1 && (
            <div className="shipping-form">
              <h2>Shipping Address</h2>
              
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={shippingAddress.fullName}
                  onChange={handleShippingChange}
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  name="street"
                  value={shippingAddress.street}
                  onChange={handleShippingChange}
                  className={errors.street ? 'error' : ''}
                />
                {errors.street && <span className="error-text">{errors.street}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleShippingChange}
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleShippingChange}
                    className={errors.state ? 'error' : ''}
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleShippingChange}
                    className={errors.zipCode ? 'error' : ''}
                  />
                  {errors.zipCode && <span className="error-text">{errors.zipCode}</span>}
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <select
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleShippingChange}
                  >
                    <option value="USA">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="UK">United Kingdom</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={shippingAddress.phone}
                  onChange={handleShippingChange}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <button className="next-btn" onClick={nextStep}>
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="payment-form">
              <h2>Payment Method</h2>

              <div className="billing-same">
                <label>
                  <input
                    type="checkbox"
                    name="sameAsShipping"
                    checked={billingAddress.sameAsShipping}
                    onChange={handleBillingChange}
                  />
                  Billing address same as shipping
                </label>
              </div>

              {!billingAddress.sameAsShipping && (
                <div className="billing-address">
                  <h3>Billing Address</h3>
                  {/* Billing address fields similar to shipping */}
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={billingAddress.fullName}
                      onChange={handleBillingChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Street Address</label>
                    <input
                      type="text"
                      name="street"
                      value={billingAddress.street}
                      onChange={handleBillingChange}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={billingAddress.city}
                        onChange={handleBillingChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        name="state"
                        value={billingAddress.state}
                        onChange={handleBillingChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={billingAddress.zipCode}
                        onChange={handleBillingChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <select
                        name="country"
                        value={billingAddress.country}
                        onChange={handleBillingChange}
                      >
                        <option value="USA">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <h3>Select Payment Method</h3>
              <div className="payment-methods">
                <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-icon">💳</span>
                  <span>Credit/Debit Card</span>
                </label>

                <label className={`payment-option ${paymentMethod === 'paypal' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === 'paypal'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-icon">🅿️</span>
                  <span>PayPal</span>
                </label>

                <label className={`payment-option ${paymentMethod === 'bank_transfer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-icon">🏦</span>
                  <span>Bank Transfer</span>
                </label>

                <label className={`payment-option ${paymentMethod === 'cash_on_delivery' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={paymentMethod === 'cash_on_delivery'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="payment-icon">💵</span>
                  <span>Cash on Delivery</span>
                </label>
              </div>

              <div className="form-group">
                <label>Order Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  rows={3}
                />
              </div>

              <div className="form-buttons">
                <button className="back-btn" onClick={prevStep}>
                  Back
                </button>
                <button className="next-btn" onClick={nextStep}>
                  Review Order
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="review-order">
              <h2>Review Your Order</h2>

              <div className="review-section">
                <h3>Shipping Address</h3>
                <p>{shippingAddress.fullName}</p>
                <p>{shippingAddress.street}</p>
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}</p>
                <p>{shippingAddress.country}</p>
                <p>{shippingAddress.phone}</p>
                <button className="edit-btn" onClick={() => setStep(1)}>Edit</button>
              </div>

              <div className="review-section">
                <h3>Payment Method</h3>
                <p>{paymentMethod.replace('_', ' ').toUpperCase()}</p>
                <button className="edit-btn" onClick={() => setStep(2)}>Edit</button>
              </div>

              <div className="review-section">
                <h3>Order Items</h3>
                {activeItems.map(item => (
                  <div key={item.product._id} className="review-item">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {notes && (
                <div className="review-section">
                  <h3>Order Notes</h3>
                  <p>{notes}</p>
                </div>
              )}

              <div className="form-buttons">
                <button className="back-btn" onClick={prevStep}>
                  Back
                </button>
                <button 
                  className="place-order-btn" 
                  onClick={placeOrder}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Place Order - $${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="order-summary-sidebar">
          <h2>Order Summary</h2>
          
          <div className="summary-items">
            {activeItems.map(item => (
              <div key={item.product._id} className="summary-item">
                <div className="item-image">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img src={item.product.images[0].url} alt={item.product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <span className="item-qty">{item.quantity}</span>
                </div>
                <div className="item-info">
                  <p className="item-name">{item.product.name}</p>
                  <p className="item-price">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="summary-row">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
