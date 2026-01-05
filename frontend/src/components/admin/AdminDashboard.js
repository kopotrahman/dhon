import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import './Admin.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>📊 Admin Dashboard</h1>
        <p>Overview of platform activity and metrics</p>
      </div>

      {/* Pending Approvals Alert */}
      {stats?.pendingApprovals?.total > 0 && (
        <div className="pending-alert">
          <span className="alert-icon">⚠️</span>
          <span className="alert-text">
            You have <strong>{stats.pendingApprovals.total}</strong> pending approvals
          </span>
          <Link to="/admin/pending-approvals" className="btn btn-sm btn-primary">
            Review Now
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.users?.total || 0}</span>
            <span className="stat-label">Total Users</span>
          </div>
          <div className="stat-breakdown">
            <span>Active: {stats?.users?.active || 0}</span>
            <span>New (30d): {stats?.users?.newThisMonth || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bookings">📅</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.bookings?.total || 0}</span>
            <span className="stat-label">Total Bookings</span>
          </div>
          <div className="stat-breakdown">
            <span>Active: {stats?.bookings?.active || 0}</span>
            <span>This week: {stats?.bookings?.thisWeek || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">💰</div>
          <div className="stat-info">
            <span className="stat-value">
              ${(stats?.revenue?.thisMonth || 0).toLocaleString()}
            </span>
            <span className="stat-label">Revenue (30d)</span>
          </div>
          <div className="stat-breakdown">
            <span>Transactions: {stats?.revenue?.transactionsThisMonth || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cars">🚗</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.cars?.total || 0}</span>
            <span className="stat-label">Listed Cars</span>
          </div>
          <div className="stat-breakdown">
            <span>Available: {stats?.cars?.available || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon jobs">💼</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.jobs?.total || 0}</span>
            <span className="stat-label">Job Postings</span>
          </div>
          <div className="stat-breakdown">
            <span>Open: {stats?.jobs?.open || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">🛒</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.orders?.total || 0}</span>
            <span className="stat-label">Orders</span>
          </div>
          <div className="stat-breakdown">
            <span>Pending: {stats?.orders?.pending || 0}</span>
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="dashboard-section">
        <h2>User Breakdown</h2>
        <div className="user-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-icon">👷</span>
            <span className="breakdown-label">Drivers</span>
            <span className="breakdown-value">{stats?.users?.byRole?.driver || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-icon">🏠</span>
            <span className="breakdown-label">Owners</span>
            <span className="breakdown-value">{stats?.users?.byRole?.owner || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-icon">👔</span>
            <span className="breakdown-label">Admins</span>
            <span className="breakdown-value">{stats?.users?.byRole?.admin || 0}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/admin/users" className="action-card">
            <span className="action-icon">👥</span>
            <span className="action-title">Manage Users</span>
            <span className="action-desc">View and manage all users</span>
          </Link>
          
          <Link to="/admin/pending-cars" className="action-card">
            <span className="action-icon">🚗</span>
            <span className="action-title">Pending Cars</span>
            <span className="action-badge">{stats?.pendingApprovals?.cars || 0}</span>
          </Link>
          
          <Link to="/admin/pending-documents" className="action-card">
            <span className="action-icon">📄</span>
            <span className="action-title">Pending Documents</span>
            <span className="action-desc">Verify uploaded documents</span>
          </Link>
          
          <Link to="/admin/tickets" className="action-card">
            <span className="action-icon">🎫</span>
            <span className="action-title">Support Tickets</span>
            <span className="action-badge">{stats?.support?.openTickets || 0}</span>
          </Link>
          
          <Link to="/admin/reviews" className="action-card">
            <span className="action-icon">⭐</span>
            <span className="action-title">Review Moderation</span>
            <span className="action-desc">Moderate user reviews</span>
          </Link>
          
          <Link to="/admin/forum" className="action-card">
            <span className="action-icon">💬</span>
            <span className="action-title">Forum Moderation</span>
            <span className="action-desc">Manage forum content</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
