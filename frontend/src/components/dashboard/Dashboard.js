import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dhon - Car Management Platform</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}!</span>
          <span className="role-badge">{user?.role}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-sidebar">
          <nav>
            <ul>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/profile">Profile</a></li>
              {user?.role === 'owner' && (
                <>
                  <li><a href="/jobs">My Jobs</a></li>
                  <li><a href="/cars">My Cars</a></li>
                </>
              )}
              {user?.role === 'driver' && (
                <>
                  <li><a href="/jobs/browse">Browse Jobs</a></li>
                  <li><a href="/applications">My Applications</a></li>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <li><a href="/admin/users">Manage Users</a></li>
                  <li><a href="/admin/approvals">Pending Approvals</a></li>
                  <li><a href="/admin/analytics">Analytics</a></li>
                </>
              )}
              <li><a href="/marketplace">Marketplace</a></li>
              <li><a href="/bookings">Bookings</a></li>
              <li><a href="/forum">Community Forum</a></li>
              <li><a href="/services">Service Centers</a></li>
              <li><a href="/support">Support</a></li>
            </ul>
          </nav>
        </div>

        <div className="dashboard-main">
          <div className="welcome-section">
            <h2>Welcome to Your Dashboard</h2>
            
            {!user?.isApproved && user?.role !== 'admin' && (
              <div className="alert alert-warning">
                <h3>⚠️ Account Pending Approval</h3>
                <p>Your account is awaiting admin approval. Some features may be restricted.</p>
              </div>
            )}

            {user?.role === 'driver' && !user?.kyc?.isVerified && (
              <div className="alert alert-info">
                <h3>📋 KYC Verification Required</h3>
                <p>Please complete your KYC verification to access all features.</p>
                <button className="btn-primary">Complete KYC</button>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <h3>Quick Stats</h3>
                <p className="stat-value">0</p>
                <p className="stat-label">Active Bookings</p>
              </div>
              <div className="stat-card">
                <h3>Status</h3>
                <p className="stat-value">{user?.isApproved ? '✓' : '⏳'}</p>
                <p className="stat-label">{user?.isApproved ? 'Approved' : 'Pending'}</p>
              </div>
              <div className="stat-card">
                <h3>Role</h3>
                <p className="stat-value">{user?.role}</p>
                <p className="stat-label">Account Type</p>
              </div>
            </div>

            <div className="features-section">
              <h3>Available Features</h3>
              <div className="features-grid">
                <div className="feature-card">
                  <h4>🚘 Car Management</h4>
                  <p>List and manage your vehicles</p>
                </div>
                <div className="feature-card">
                  <h4>👨‍💼 Driver Hiring</h4>
                  <p>Post jobs and hire drivers</p>
                </div>
                <div className="feature-card">
                  <h4>📅 Booking System</h4>
                  <p>Schedule and track bookings</p>
                </div>
                <div className="feature-card">
                  <h4>🛒 Marketplace</h4>
                  <p>Buy car parts and accessories</p>
                </div>
                <div className="feature-card">
                  <h4>💬 Community</h4>
                  <p>Connect with other users</p>
                </div>
                <div className="feature-card">
                  <h4>🔧 Service Centers</h4>
                  <p>Find nearby service locations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
