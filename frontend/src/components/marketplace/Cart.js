import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      await api.put(`/cart/items/${productId}`, { quantity });
      fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/items/${productId}`);
      fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const saveForLater = async (productId) => {
    try {
      await api.post(`/cart/items/${productId}/save-for-later`);
      fetchCart();
    } catch (error) {
      console.error('Error saving for later:', error);
    }
  };

  const moveToCart = async (productId) => {
    try {
      await api.post(`/cart/items/${productId}/move-to-cart`);
      fetchCart();
    } catch (error) {
      console.error('Error moving to cart:', error);
    }
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    try {
      await api.post('/cart/coupon', { code: couponCode });
      fetchCart();
      setCouponCode('');
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Invalid coupon');
    }
  };

  const removeCoupon = async () => {
    try {
      await api.delete('/cart/coupon');
      fetchCart();
    } catch (error) {
      console.error('Error removing coupon:', error);
    }
  };

  const clearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await api.delete('/cart/clear');
        fetchCart();
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  };

  const proceedToCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return <div className="loading">Loading cart...</div>;
  }

  const activeItems = cart?.items?.filter(item => !item.savedForLater) || [];
  const savedItems = cart?.items?.filter(item => item.savedForLater) || [];

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>

      {activeItems.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any items yet.</p>
          <Link to="/marketplace" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <div className="cart-header">
              <span>{activeItems.length} item(s) in cart</span>
              <button className="clear-cart-btn" onClick={clearCart}>
                Clear Cart
              </button>
            </div>

            {activeItems.map(item => (
              <div key={item.product._id} className="cart-item">
                <div className="item-image">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img src={item.product.images[0].url} alt={item.product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>

                <div className="item-details">
                  <Link to={`/marketplace/product/${item.product.slug || item.product._id}`}>
                    <h3>{item.product.name}</h3>
                  </Link>
                  {item.product.brand && (
                    <p className="item-brand">{item.product.brand}</p>
                  )}
                  
                  <div className="item-stock">
                    {item.product.stock > 0 ? (
                      <span className="in-stock">In Stock</span>
                    ) : (
                      <span className="out-of-stock">Out of Stock</span>
                    )}
                  </div>
                </div>

                <div className="item-quantity">
                  <button 
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                  >
                    +
                  </button>
                </div>

                <div className="item-price">
                  <p className="unit-price">${item.product.price.toFixed(2)} each</p>
                  <p className="total-price">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="item-actions">
                  <button 
                    className="save-later-btn"
                    onClick={() => saveForLater(item.product._id)}
                  >
                    Save for Later
                  </button>
                  <button 
                    className="remove-btn"
                    onClick={() => removeItem(item.product._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            
            <div className="summary-row">
              <span>Subtotal ({activeItems.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
              <span>${cart.subtotal?.toFixed(2)}</span>
            </div>

            {cart.couponCode && (
              <div className="summary-row discount">
                <span>
                  Coupon: {cart.couponCode}
                  <button className="remove-coupon" onClick={removeCoupon}>×</button>
                </span>
                <span>-${cart.couponDiscount?.toFixed(2)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Estimated Shipping</span>
              <span>{cart.subtotal > 100 ? 'FREE' : '$10.00'}</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span>${cart.total?.toFixed(2)}</span>
            </div>

            {!cart.couponCode && (
              <form className="coupon-form" onSubmit={applyCoupon}>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button type="submit">Apply</button>
                {couponError && <p className="coupon-error">{couponError}</p>}
              </form>
            )}

            <button 
              className="checkout-btn"
              onClick={proceedToCheckout}
              disabled={activeItems.length === 0}
            >
              Proceed to Checkout
            </button>

            <Link to="/marketplace" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      )}

      {/* Saved for Later */}
      {savedItems.length > 0 && (
        <div className="saved-for-later">
          <h2>Saved for Later ({savedItems.length})</h2>
          <div className="saved-items">
            {savedItems.map(item => (
              <div key={item.product._id} className="saved-item">
                <div className="item-image">
                  {item.product.images && item.product.images.length > 0 ? (
                    <img src={item.product.images[0].url} alt={item.product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="item-info">
                  <h4>{item.product.name}</h4>
                  <p className="price">${item.product.price.toFixed(2)}</p>
                  {item.product.stock > 0 ? (
                    <button onClick={() => moveToCart(item.product._id)}>
                      Move to Cart
                    </button>
                  ) : (
                    <span className="out-of-stock">Out of Stock</span>
                  )}
                  <button 
                    className="remove-btn"
                    onClick={() => removeItem(item.product._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
