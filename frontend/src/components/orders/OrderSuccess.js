import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Orders.css';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get order ID from query params or location state
  const orderId = new URLSearchParams(location.search).get('orderId') || location.state?.orderId;

  useEffect(() => {
    if (!orderId) {
      navigate('/marketplace');
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data.order);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="order-not-found">
        <h2>Order Not Found</h2>
        <p>We couldn't find your order details.</p>
        <Link to="/marketplace" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="order-success-container">
      <div className="success-icon">
        <svg viewBox="0 0 52 52" width="80" height="80">
          <circle cx="26" cy="26" r="25" fill="#4361ee" />
          <path fill="none" stroke="white" strokeWidth="4" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
        </svg>
      </div>

      <h1>Order Placed Successfully!</h1>
      <p className="success-message">
        Thank you for your order. We've sent a confirmation email to your registered email address.
      </p>

      <div className="order-summary-card">
        <div className="order-header">
          <div className="order-number">
            <span className="label">Order Number</span>
            <span className="value">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="order-date">
            <span className="label">Order Date</span>
            <span className="value">{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="order-status">
          <span className={`status-badge ${order.status}`}>{order.status}</span>
        </div>

        <div className="order-items-preview">
          <h3>Items Ordered</h3>
          {order.items?.slice(0, 3).map((item, index) => (
            <div key={index} className="item-preview">
              <div className="item-image">
                {item.product?.images?.[0] ? (
                  <img src={item.product.images[0]} alt={item.name || item.product?.name} />
                ) : (
                  <div className="placeholder">No Image</div>
                )}
              </div>
              <div className="item-details">
                <span className="item-name">{item.name || item.product?.name}</span>
                <span className="item-qty">Qty: {item.quantity}</span>
              </div>
              <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.items?.length > 3 && (
            <p className="more-items">+{order.items.length - 3} more items</p>
          )}
        </div>

        <div className="order-totals">
          <div className="total-row">
            <span>Subtotal</span>
            <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="total-row">
            <span>Shipping</span>
            <span>${order.shippingCost?.toFixed(2) || '0.00'}</span>
          </div>
          {order.discount > 0 && (
            <div className="total-row discount">
              <span>Discount</span>
              <span>-${order.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="total-row">
            <span>Tax</span>
            <span>${order.tax?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="total-row grand-total">
            <span>Total</span>
            <span>${order.total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="delivery-info">
          <h3>Delivery Address</h3>
          <address>
            {order.shippingAddress?.fullName || order.shippingAddress?.name}<br />
            {order.shippingAddress?.address || order.shippingAddress?.street}<br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode || order.shippingAddress?.postalCode}<br />
            {order.shippingAddress?.country}
          </address>
          {order.estimatedDelivery && (
            <p className="delivery-estimate">
              Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="payment-info">
          <h3>Payment Method</h3>
          <p>{order.paymentMethod === 'card' ? 'Credit/Debit Card' : order.paymentMethod}</p>
          <span className={`payment-status ${order.paymentStatus}`}>
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="what-next">
        <h2>What's Next?</h2>
        <div className="next-steps">
          <div className="step">
            <div className="step-icon">📧</div>
            <h4>Order Confirmation</h4>
            <p>You'll receive an email confirmation with your order details.</p>
          </div>
          <div className="step">
            <div className="step-icon">📦</div>
            <h4>Shipping Updates</h4>
            <p>We'll notify you when your order ships with tracking information.</p>
          </div>
          <div className="step">
            <div className="step-icon">🚚</div>
            <h4>Delivery</h4>
            <p>Your items will arrive at your doorstep.</p>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <Link to={`/orders/${order._id}`} className="btn-secondary">
          View Order Details
        </Link>
        <Link to="/orders" className="btn-secondary">
          View All Orders
        </Link>
        <Link to="/marketplace" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
