import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import NotificationBell from '../notifications/NotificationBell';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="main-header" role="banner">
      <div className="header-container">
        <Link to="/dashboard" className="logo" aria-label="Go to dashboard">
          <h1>Dhon</h1>
        </Link>

        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger"></span>
        </button>

        <nav className={`main-nav ${mobileMenuOpen ? 'open' : ''}`} role="navigation">
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/jobs">Jobs</Link></li>
            <li><Link to="/marketplace">Marketplace</Link></li>
            <li><Link to="/forum">Forum</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/support">Support</Link></li>
            {user?.role === 'admin' && (
              <li><Link to="/admin">Admin</Link></li>
            )}
          </ul>
        </nav>

        <div className="header-actions">
          <NotificationBell />
          
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

          <div className="user-menu">
            <span className="user-name">{user?.name}</span>
            <span className="role-badge">{user?.role}</span>
            <button onClick={handleLogout} className="btn-logout" aria-label="Logout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
