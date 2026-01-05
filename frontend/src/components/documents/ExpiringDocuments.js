import React, { useState, useEffect } from 'react';
import { carAPI } from '../../utils/api';
import './Documents.css';

const ExpiringDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', '7', '14', '30'
  const [error, setError] = useState('');

  useEffect(() => {
    loadExpiringDocuments();
  }, [filter]);

  const loadExpiringDocuments = async () => {
    setLoading(true);
    try {
      const days = filter === 'all' ? 30 : parseInt(filter);
      const response = await carAPI.getExpiringDocuments(days);
      setDocuments(response.data);
    } catch (err) {
      setError('Failed to load expiring documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const documentTypes = {
    registration: { label: 'Registration Certificate', icon: '📋' },
    insurance: { label: 'Insurance', icon: '🛡️' },
    permit: { label: 'Permit', icon: '📄' },
    fitness: { label: 'Fitness Certificate', icon: '✅' },
    pollution: { label: 'PUC Certificate', icon: '🌿' },
    license: { label: 'Driving License', icon: '🪪' },
    other: { label: 'Other', icon: '📎' }
  };

  const getUrgencyLevel = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return { level: 'expired', text: 'Expired', color: '#dc2626' };
    if (daysLeft <= 3) return { level: 'critical', text: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`, color: '#dc2626' };
    if (daysLeft <= 7) return { level: 'urgent', text: `${daysLeft} days left`, color: '#ea580c' };
    if (daysLeft <= 14) return { level: 'warning', text: `${daysLeft} days left`, color: '#d97706' };
    return { level: 'notice', text: `${daysLeft} days left`, color: '#eab308' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group documents by car
  const groupedByCar = documents.reduce((acc, item) => {
    const carKey = item.car?._id || 'unknown';
    if (!acc[carKey]) {
      acc[carKey] = {
        car: item.car,
        documents: []
      };
    }
    acc[carKey].documents.push(item);
    return acc;
  }, {});

  return (
    <div className="expiring-documents-container">
      <div className="page-header">
        <div className="header-left">
          <h1>⚠️ Expiring Documents</h1>
          <p>Documents that need attention</p>
        </div>
        <div className="header-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All (30 days)
          </button>
          <button 
            className={`filter-btn ${filter === '14' ? 'active' : ''}`}
            onClick={() => setFilter('14')}
          >
            Within 14 days
          </button>
          <button 
            className={`filter-btn ${filter === '7' ? 'active' : ''}`}
            onClick={() => setFilter('7')}
          >
            Within 7 days
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="expiring-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading expiring documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state success">
            <span className="empty-icon">✅</span>
            <h3>All documents are up to date!</h3>
            <p>No documents expiring within the selected period.</p>
          </div>
        ) : (
          <>
            <div className="summary-cards">
              <div className="summary-card critical">
                <span className="summary-number">
                  {documents.filter(d => getUrgencyLevel(d.expiryDate).level === 'expired').length}
                </span>
                <span className="summary-label">Expired</span>
              </div>
              <div className="summary-card urgent">
                <span className="summary-number">
                  {documents.filter(d => ['critical', 'urgent'].includes(getUrgencyLevel(d.expiryDate).level)).length}
                </span>
                <span className="summary-label">Critical (≤7 days)</span>
              </div>
              <div className="summary-card warning">
                <span className="summary-number">
                  {documents.filter(d => getUrgencyLevel(d.expiryDate).level === 'warning').length}
                </span>
                <span className="summary-label">Warning (≤14 days)</span>
              </div>
              <div className="summary-card notice">
                <span className="summary-number">
                  {documents.filter(d => getUrgencyLevel(d.expiryDate).level === 'notice').length}
                </span>
                <span className="summary-label">Notice (≤30 days)</span>
              </div>
            </div>

            <div className="cars-list">
              {Object.values(groupedByCar).map(({ car, documents: carDocs }) => (
                <div key={car?._id} className="car-documents-section">
                  <div className="car-header">
                    <div className="car-info">
                      {car?.images?.[0] && (
                        <img 
                          src={car.images[0]} 
                          alt={`${car.make} ${car.model}`}
                          className="car-thumb"
                        />
                      )}
                      <div>
                        <h3>{car?.make} {car?.model} ({car?.year})</h3>
                        <p className="plate">{car?.licensePlate}</p>
                      </div>
                    </div>
                    <span className="doc-count">
                      {carDocs.length} document{carDocs.length !== 1 ? 's' : ''} expiring
                    </span>
                  </div>

                  <div className="expiring-docs-list">
                    {carDocs.map((doc, idx) => {
                      const docType = documentTypes[doc.type] || documentTypes.other;
                      const urgency = getUrgencyLevel(doc.expiryDate);

                      return (
                        <div key={idx} className={`expiring-doc-item ${urgency.level}`}>
                          <div className="doc-icon">{docType.icon}</div>
                          <div className="doc-info">
                            <span className="doc-type">{docType.label}</span>
                            <span className="expiry-date">
                              Expires: {formatDate(doc.expiryDate)}
                            </span>
                          </div>
                          <div className="urgency-badge" style={{ 
                            backgroundColor: `${urgency.color}20`,
                            color: urgency.color 
                          }}>
                            {urgency.text}
                          </div>
                          <button className="btn btn-sm btn-primary">
                            📤 Update
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExpiringDocuments;
