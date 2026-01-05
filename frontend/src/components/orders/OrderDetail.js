import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import './Orders.css';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.order);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await api.patch(`/orders/${id}/cancel`);
      fetchOrder();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleRequestReturn = async () => {
    const reason = prompt('Please provide a reason for the return:');
    if (!reason) return;

    try {
      await api.post(`/orders/${id}/return`, { reason });
      fetchOrder();
      alert('Return request submitted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request return');
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await api.get(`/orders/${id}/invoice`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download invoice');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      processing: '#8b5cf6',
      shipped: '#06b6d4',
      delivered: '#10b981',
      cancelled: '#ef4444',
      returned: '#6b7280',
    };
    return colors[status] || '#666';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/orders" className="btn-primary">Back to Orders</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-container">
        <h2>Order Not Found</h2>
        <Link to="/orders" className="btn-primary">Back to Orders</Link>
      </div>
    );
  }

  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="order-detail-container">
      <div className="order-detail-header">
        <Link to="/orders" className="back-link">
          ← Back to Orders
        </Link>
        <div className="order-title">
          <h1>Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}</h1>
          <span className="order-date">Placed on {formatDate(order.createdAt)}</span>
        </div>
        <div className="header-actions">
          <button onClick={downloadInvoice} className="btn-invoice">
            📄 Download Invoice
          </button>
        </div>
      </div>

      {/* Order Status Progress */}
      {!['cancelled', 'returned'].includes(order.status) && (
        <div className="status-progress">
          {statusSteps.map((step, index) => (
            <div
              key={step}
              className={`progress-step ${index <= currentStepIndex ? 'completed' : ''} ${
                index === currentStepIndex ? 'current' : ''
              }`}
            >
              <div className="step-indicator">
                {index < currentStepIndex ? '✓' : index + 1}
              </div>
              <span className="step-label">{step.charAt(0).toUpperCase() + step.slice(1)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="order-detail-content">
        <div className="order-main">
          {/* Order Items */}
          <div className="detail-section items-section">
            <h2>Order Items</h2>
            <div className="items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item-detail">
                  <div className="item-image">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.name} />
                    ) : (
                      <div className="placeholder">📦</div>
                    )}
                  </div>
                  <div className="item-info">
                    <h4>{item.name || item.product?.name}</h4>
                    {item.variant && <span className="item-variant">{item.variant}</span>}
                    {item.product?.sku && <span className="item-sku">SKU: {item.product.sku}</span>}
                  </div>
                  <div className="item-quantity">
                    <span>Qty: {item.quantity}</span>
                  </div>
                  <div className="item-pricing">
                    <span className="unit-price">${item.price?.toFixed(2)} each</span>
                    <span className="total-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Info */}
          {order.tracking?.updates?.length > 0 && (
            <div className="detail-section tracking-section">
              <h2>Tracking Updates</h2>
              {order.tracking.trackingNumber && (
                <p className="tracking-number">
                  Tracking Number: <strong>{order.tracking.trackingNumber}</strong>
                  {order.tracking.carrier && <> ({order.tracking.carrier})</>}
                </p>
              )}
              <div className="tracking-timeline">
                {order.tracking.updates.slice().reverse().map((update, index) => (
                  <div key={index} className="tracking-update">
                    <div className="update-dot"></div>
                    <div className="update-content">
                      <span className="update-status">{update.status}</span>
                      {update.location && <span className="update-location">{update.location}</span>}
                      <span className="update-date">{formatDate(update.timestamp)}</span>
                      {update.description && <p className="update-desc">{update.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="order-sidebar">
          {/* Order Summary */}
          <div className="detail-section summary-section">
            <h3>Order Summary</h3>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>${order.shippingCost?.toFixed(2) || '0.00'}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Tax</span>
                <span>${order.tax?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${order.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="payment-status-row">
              <span>Payment Status</span>
              <span className={`payment-badge ${order.paymentStatus}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="detail-section address-section">
            <h3>Shipping Address</h3>
            <address>
              <strong>{order.shippingAddress?.fullName || order.shippingAddress?.name}</strong><br />
              {order.shippingAddress?.address || order.shippingAddress?.street}<br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode || order.shippingAddress?.postalCode}<br />
              {order.shippingAddress?.country}
            </address>
            {order.shippingAddress?.phone && (
              <p className="phone">Phone: {order.shippingAddress.phone}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="detail-section payment-section">
            <h3>Payment Method</h3>
            <p>{order.paymentMethod === 'card' ? 'Credit/Debit Card' : order.paymentMethod}</p>
          </div>

          {/* Order Actions */}
          <div className="detail-section actions-section">
            <h3>Actions</h3>
            <div className="action-buttons-vertical">
              {order.status === 'pending' && (
                <button onClick={handleCancelOrder} className="btn-cancel">
                  Cancel Order
                </button>
              )}
              {order.status === 'delivered' && (
                <>
                  <button onClick={handleRequestReturn} className="btn-return">
                    Request Return
                  </button>
                  <Link to={`/orders/${order._id}/review`} className="btn-review">
                    Write Review
                  </Link>
                </>
              )}
              <Link to="/support?topic=order" className="btn-support">
                Need Help?
              </Link>
            </div>
          </div>

          {/* Estimated Delivery */}
          {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="detail-section delivery-section">
              <h3>Estimated Delivery</h3>
              <p className="delivery-date">{new Date(order.estimatedDelivery).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
