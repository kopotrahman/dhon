import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Vendor.css';

const VendorDashboard = () => {
  const [vendor, setVendor] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const [profileRes, dashboardRes, payoutsRes] = await Promise.all([
        api.get('/vendors/profile'),
        api.get('/vendors/dashboard'),
        api.get('/vendors/payouts'),
      ]);

      setVendor(profileRes.data.vendor);
      setDashboard(dashboardRes.data);
      setPayouts(payoutsRes.data.payouts || []);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = prompt('Enter payout amount:');
    if (!amount || isNaN(amount)) return;

    try {
      await api.post('/vendors/payouts/request', { amount: parseFloat(amount) });
      alert('Payout request submitted successfully');
      fetchVendorData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to request payout');
    }
  };

  if (loading) {
    return <div className="loading">Loading vendor dashboard...</div>;
  }

  if (!vendor) {
    return (
      <div className="vendor-not-found">
        <h2>Not a Vendor</h2>
        <p>You need to register as a vendor to access this dashboard.</p>
        <Link to="/vendor/register" className="btn-primary">
          Register as Vendor
        </Link>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      <div className="vendor-header">
        <div className="vendor-info">
          <div className="vendor-logo">
            {vendor.businessInfo?.logo ? (
              <img src={vendor.businessInfo.logo} alt={vendor.businessInfo?.businessName} />
            ) : (
              <div className="logo-placeholder">{vendor.businessInfo?.businessName?.[0]}</div>
            )}
          </div>
          <div className="vendor-details">
            <h1>{vendor.businessInfo?.businessName || 'My Store'}</h1>
            <span className={`status-badge ${vendor.status}`}>{vendor.status}</span>
            {vendor.verified && <span className="verified-badge">✓ Verified</span>}
          </div>
        </div>
        <div className="header-actions">
          <Link to="/vendor/settings" className="btn-secondary">Settings</Link>
          <Link to="/vendor/products/new" className="btn-primary">Add Product</Link>
        </div>
      </div>

      {vendor.status === 'pending' && (
        <div className="alert alert-warning">
          Your vendor account is pending approval. You'll be notified once approved.
        </div>
      )}

      {vendor.status === 'rejected' && (
        <div className="alert alert-error">
          Your vendor application was rejected. Please contact support for more information.
        </div>
      )}

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={activeTab === 'payouts' ? 'active' : ''}
          onClick={() => setActiveTab('payouts')}
        >
          Payouts
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-value">${dashboard?.totalSales?.toFixed(2) || '0.00'}</span>
                <span className="stat-label">Total Sales</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <span className="stat-value">{dashboard?.totalOrders || 0}</span>
                <span className="stat-label">Total Orders</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛍️</div>
              <div className="stat-content">
                <span className="stat-value">{dashboard?.totalProducts || 0}</span>
                <span className="stat-label">Products</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <span className="stat-value">${vendor.balance?.available?.toFixed(2) || '0.00'}</span>
                <span className="stat-label">Available Balance</span>
              </div>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="recent-orders card">
              <h3>Recent Orders</h3>
              {dashboard?.recentOrders?.length > 0 ? (
                <div className="orders-list">
                  {dashboard.recentOrders.slice(0, 5).map((order) => (
                    <div key={order._id} className="order-row">
                      <span className="order-id">#{order._id.slice(-6)}</span>
                      <span className="order-customer">{order.user?.name || 'Customer'}</span>
                      <span className="order-amount">${order.total?.toFixed(2)}</span>
                      <span className={`order-status ${order.status}`}>{order.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No recent orders</p>
              )}
              <Link to="/vendor/orders" className="view-all">View All Orders →</Link>
            </div>

            <div className="top-products card">
              <h3>Top Products</h3>
              {dashboard?.topProducts?.length > 0 ? (
                <div className="products-list">
                  {dashboard.topProducts.slice(0, 5).map((product) => (
                    <div key={product._id} className="product-row">
                      <div className="product-image">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} />
                        ) : (
                          <div className="placeholder">📦</div>
                        )}
                      </div>
                      <span className="product-name">{product.name}</span>
                      <span className="product-sales">{product.salesCount || 0} sold</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No products yet</p>
              )}
              <Link to="/vendor/products" className="view-all">View All Products →</Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="products-tab">
          <div className="products-header">
            <h2>My Products</h2>
            <Link to="/vendor/products/new" className="btn-primary">Add Product</Link>
          </div>
          {dashboard?.products?.length > 0 ? (
            <div className="products-grid">
              {dashboard.products.map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="placeholder">📦</div>
                    )}
                    <span className={`status ${product.status}`}>{product.status}</span>
                  </div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <p className="price">${product.price?.toFixed(2)}</p>
                    <p className="stock">{product.stock} in stock</p>
                  </div>
                  <div className="product-actions">
                    <Link to={`/vendor/products/${product._id}/edit`}>Edit</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products">
              <p>You haven't added any products yet.</p>
              <Link to="/vendor/products/new" className="btn-primary">Add Your First Product</Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="orders-tab">
          <h2>Orders</h2>
          {dashboard?.orders?.length > 0 ? (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.orders.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-6)}</td>
                    <td>{order.user?.name || 'Customer'}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>${order.total?.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${order.status}`}>{order.status}</span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/vendor/orders/${order._id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No orders yet</p>
          )}
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="payouts-tab">
          <div className="payout-summary">
            <div className="balance-card">
              <h3>Balance</h3>
              <div className="balance-row">
                <span>Available</span>
                <span className="amount">${vendor.balance?.available?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="balance-row">
                <span>Pending</span>
                <span className="amount">${vendor.balance?.pending?.toFixed(2) || '0.00'}</span>
              </div>
              <button
                onClick={handleRequestPayout}
                className="btn-primary"
                disabled={!vendor.balance?.available || vendor.balance.available < 10}
              >
                Request Payout
              </button>
              <p className="payout-note">Minimum payout: $10.00</p>
            </div>
          </div>

          <div className="payout-history">
            <h3>Payout History</h3>
            {payouts.length > 0 ? (
              <table className="payouts-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr key={payout._id}>
                      <td>{new Date(payout.createdAt).toLocaleDateString()}</td>
                      <td>${payout.amount?.toFixed(2)}</td>
                      <td>{payout.method || 'Bank Transfer'}</td>
                      <td>
                        <span className={`status-badge ${payout.status}`}>{payout.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No payout history</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
