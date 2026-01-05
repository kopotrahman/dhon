import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Orders.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [filter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 10,
      });
      
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await api.get(`/orders?${params}`);
      setOrders(response.data.orders);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      await api.patch(`/orders/${orderId}/cancel`);
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="order-history-container">
      <div className="order-history-header">
        <h1>My Orders</h1>
        <p>Track and manage your orders</p>
      </div>

      <div className="order-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => { setFilter('all'); setPage(1); }}
        >
          All Orders
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => { setFilter('pending'); setPage(1); }}
        >
          Pending
        </button>
        <button
          className={filter === 'processing' ? 'active' : ''}
          onClick={() => { setFilter('processing'); setPage(1); }}
        >
          Processing
        </button>
        <button
          className={filter === 'shipped' ? 'active' : ''}
          onClick={() => { setFilter('shipped'); setPage(1); }}
        >
          Shipped
        </button>
        <button
          className={filter === 'delivered' ? 'active' : ''}
          onClick={() => { setFilter('delivered'); setPage(1); }}
        >
          Delivered
        </button>
        <button
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => { setFilter('cancelled'); setPage(1); }}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h2>No Orders Found</h2>
          <p>
            {filter === 'all'
              ? "You haven't placed any orders yet."
              : `No ${filter} orders found.`}
          </p>
          <Link to="/marketplace" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <div className="order-info">
                  <span className="order-number">
                    Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                  </span>
                  <span className="order-date">
                    Placed on {formatDate(order.createdAt)}
                  </span>
                </div>
                <span
                  className="order-status"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status}
                </span>
              </div>

              <div className="order-items">
                {order.items?.slice(0, 3).map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-image">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.name} />
                      ) : (
                        <div className="placeholder">📦</div>
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
                  <p className="more-items-link">
                    +{order.items.length - 3} more items
                  </p>
                )}
              </div>

              <div className="order-card-footer">
                <div className="order-total">
                  <span className="label">Total:</span>
                  <span className="amount">${order.total?.toFixed(2)}</span>
                </div>

                <div className="order-actions">
                  <Link to={`/orders/${order._id}`} className="btn-view">
                    View Details
                  </Link>
                  
                  {order.status === 'pending' && (
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancelOrder(order._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                  
                  {order.status === 'delivered' && (
                    <Link to={`/orders/${order._id}/review`} className="btn-review">
                      Write Review
                    </Link>
                  )}

                  {order.status === 'shipped' && order.tracking?.trackingNumber && (
                    <a
                      href={`https://track.example.com/${order.tracking.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-track"
                    >
                      Track Package
                    </a>
                  )}
                </div>
              </div>

              {order.tracking?.updates?.length > 0 && (
                <div className="tracking-preview">
                  <span className="tracking-latest">
                    📍 {order.tracking.updates[order.tracking.updates.length - 1].status}
                    {order.tracking.updates[order.tracking.updates.length - 1].location && (
                      <> - {order.tracking.updates[order.tracking.updates.length - 1].location}</>
                    )}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
