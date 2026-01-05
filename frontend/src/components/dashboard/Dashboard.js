import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              
              {/* Jobs Section */}
              <li className="nav-section">Jobs</li>
              <li><Link to="/jobs">Browse Jobs</Link></li>
              {user?.role === 'driver' && (
                <li><Link to="/my-applications">My Applications</Link></li>
              )}
              
              {/* Owner Section */}
              {user?.role === 'owner' && (
                <>
                  <li className="nav-section">My Cars</li>
                  <li><Link to="/cars">My Vehicles</Link></li>
                  <li><Link to="/my-documents">Documents</Link></li>
                </>
              )}
              
              {/* Bookings Section */}
              <li className="nav-section">Bookings</li>
              <li><Link to="/my-bookings">My Bookings</Link></li>
              
              {/* Admin Section */}
              {user?.role === 'admin' && (
                <>
                  <li className="nav-section">Admin</li>
                  <li><Link to="/admin/pending-cars">Pending Cars</Link></li>
                  <li><Link to="/admin/pending-documents">Pending Documents</Link></li>
                  <li><Link to="/admin/users">Manage Users</Link></li>
                  <li><Link to="/admin/analytics">Analytics</Link></li>
                </>
              )}
              
              {/* Other */}
              <li className="nav-section">Other</li>
              <li><Link to="/marketplace">Marketplace</Link></li>
              <li><Link to="/forum">Community Forum</Link></li>
              <li><Link to="/services">Service Centers</Link></li>
              <li><Link to="/support">Support</Link></li>
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
              <h3>Quick Actions</h3>
              <div className="features-grid">
                <Link to="/jobs" className="feature-card">
                  <h4>👨‍💼 Driver Jobs</h4>
                  <p>Browse and apply for driver positions</p>
                </Link>
                <Link to="/my-bookings" className="feature-card">
                  <h4>📅 My Bookings</h4>
                  <p>View and manage your bookings</p>
                </Link>
                {user?.role === 'owner' && (
                  <Link to="/my-documents" className="feature-card">
                    <h4>📄 Documents</h4>
                    <p>Manage car documents & renewals</p>
                  </Link>
                )}
                {user?.role === 'driver' && (
                  <Link to="/my-applications" className="feature-card">
                    <h4>📋 Applications</h4>
                    <p>Track your job applications</p>
                  </Link>
                )}
                <Link to="/marketplace" className="feature-card">
                  <h4>🛒 Marketplace</h4>
                  <p>Buy car parts and accessories</p>
                </Link>
                <Link to="/forum" className="feature-card">
                  <h4>💬 Community</h4>
                  <p>Connect with other users</p>
                </Link>
                <Link to="/services" className="feature-card">
                  <h4>🔧 Service Centers</h4>
                  <p>Find nearby service locations</p>
                </Link>
                {user?.role === 'admin' && (
                  <>
                    <Link to="/admin/pending-cars" className="feature-card admin">
                      <h4>🚗 Pending Cars</h4>
                      <p>Approve or reject car listings</p>
                    </Link>
                    <Link to="/admin/pending-documents" className="feature-card admin">
                      <h4>📄 Pending Docs</h4>
                      <p>Verify uploaded documents</p>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
