import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceCenterAPI } from '../../utils/api';
import './Services.css';

const ServiceCenterList = () => {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    city: '',
    service: ''
  });
  const [userLocation, setUserLocation] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => console.log('Geolocation not available:', err)
      );
    }
  }, []);

  useEffect(() => {
    fetchCenters();
  }, [filters, page, userLocation]);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page,
        limit: 12
      };

      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = 50; // 50km radius
      }

      const response = await serviceCenterAPI.getCenters(params);
      setCenters(response.data.centers);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Failed to load service centers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`star ${i < Math.round(rating) ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  const formatWorkingHours = (hours) => {
    if (!hours) return 'Hours not available';
    const today = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    return hours[today] || 'Closed';
  };

  if (loading && page === 1) {
    return <div className="loading">Loading service centers...</div>;
  }

  return (
    <div className="service-centers-container">
      <div className="page-header">
        <h1>🔧 Service Centers</h1>
        <p>Find nearby service centers for maintenance and repairs</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={filters.city}
            onChange={handleFilterChange}
            placeholder="Enter city..."
          />
        </div>
        <div className="filter-group">
          <label htmlFor="service">Service Type</label>
          <select
            id="service"
            name="service"
            value={filters.service}
            onChange={handleFilterChange}
          >
            <option value="">All Services</option>
            <option value="Oil Change">Oil Change</option>
            <option value="Tire Service">Tire Service</option>
            <option value="Brake Service">Brake Service</option>
            <option value="Engine Repair">Engine Repair</option>
            <option value="AC Service">AC Service</option>
            <option value="General Maintenance">General Maintenance</option>
          </select>
        </div>
        {userLocation && (
          <div className="location-info">
            <span className="location-badge">📍 Using your location</span>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="centers-grid">
        {centers.length === 0 ? (
          <div className="no-results">
            <p>No service centers found. Try adjusting your filters.</p>
          </div>
        ) : (
          centers.map(center => (
            <article key={center._id} className="center-card">
              <div className="center-header">
                <h3>{center.name}</h3>
                <div className="center-rating">
                  {renderStars(center.rating?.average || 0)}
                  <span className="rating-count">({center.rating?.count || 0})</span>
                </div>
              </div>

              <p className="center-description">{center.description}</p>

              <div className="center-info">
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <span>{center.location?.address || 'Address not available'}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">📞</span>
                  <span>{center.contact?.phone || 'Phone not available'}</span>
                </div>
                <div className="info-item">
                  <span className="info-icon">🕐</span>
                  <span>Today: {formatWorkingHours(center.workingHours)}</span>
                </div>
              </div>

              <div className="center-services">
                {center.services?.slice(0, 4).map((service, index) => (
                  <span key={index} className="service-tag">{service}</span>
                ))}
                {center.services?.length > 4 && (
                  <span className="service-tag more">+{center.services.length - 4} more</span>
                )}
              </div>

              <div className="center-actions">
                <Link to={`/services/${center._id}`} className="btn-view">
                  View Details
                </Link>
                <Link to={`/services/${center._id}/book`} className="btn-book">
                  Book Service
                </Link>
              </div>
            </article>
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setPage(p => p - 1)} 
            disabled={page === 1}
          >
            ← Previous
          </button>
          <span>Page {page} of {pagination.pages}</span>
          <button 
            onClick={() => setPage(p => p + 1)} 
            disabled={page === pagination.pages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceCenterList;
