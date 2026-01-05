import React, { useState, useEffect } from 'react';
import { carAPI } from '../../utils/api';
import './Admin.css';

const PendingCarsAdmin = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadPendingCars();
  }, []);

  const loadPendingCars = async () => {
    setLoading(true);
    try {
      const response = await carAPI.getPendingCars();
      setCars(response.data);
    } catch (error) {
      console.error('Error loading pending cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (carId) => {
    setProcessing(carId);
    try {
      await carAPI.approveCar(carId, { approved: true });
      loadPendingCars();
    } catch (error) {
      console.error('Error approving car:', error);
      alert(error.response?.data?.message || 'Failed to approve car');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedCar || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(selectedCar._id);
    try {
      await carAPI.approveCar(selectedCar._id, { 
        approved: false, 
        rejectionReason 
      });
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedCar(null);
      loadPendingCars();
    } catch (error) {
      console.error('Error rejecting car:', error);
      alert(error.response?.data?.message || 'Failed to reject car');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (car) => {
    setSelectedCar(car);
    setShowRejectModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🚗 Pending Car Approvals</h1>
        <p>Review and approve or reject car listings</p>
        <span className="badge">{cars.length} pending</span>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading pending cars...</p>
        </div>
      ) : cars.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <h3>All caught up!</h3>
          <p>No pending car approvals at this time.</p>
        </div>
      ) : (
        <div className="pending-list">
          {cars.map((car) => (
            <div key={car._id} className="pending-card">
              <div className="card-left">
                <div className="car-images">
                  {car.images?.slice(0, 3).map((img, idx) => (
                    <img key={idx} src={img} alt={`${car.make} ${car.model}`} />
                  ))}
                  {car.images?.length > 3 && (
                    <div className="more-images">+{car.images.length - 3}</div>
                  )}
                </div>
              </div>

              <div className="card-middle">
                <div className="car-title">
                  <h3>{car.make} {car.model} ({car.year})</h3>
                  <span className="plate">{car.licensePlate}</span>
                </div>

                <div className="car-specs">
                  <span>🚗 {car.type}</span>
                  <span>⚙️ {car.transmission}</span>
                  <span>⛽ {car.fuelType}</span>
                  <span>🎨 {car.color}</span>
                </div>

                <div className="car-rates">
                  <span>💰 Hourly: ${car.rentRates?.hourly}</span>
                  <span>💰 Daily: ${car.rentRates?.daily}</span>
                </div>

                <div className="car-meta">
                  <span>📍 {car.location?.city}, {car.location?.state}</span>
                  <span>📅 Submitted: {formatDate(car.createdAt)}</span>
                </div>

                <div className="owner-info">
                  <span>👤 Owner: {car.owner?.name}</span>
                  <span>📧 {car.owner?.email}</span>
                  <span>📱 {car.owner?.phone}</span>
                </div>

                {car.documents?.length > 0 && (
                  <div className="documents-summary">
                    <span className="doc-label">📄 Documents:</span>
                    {car.documents.map((doc, idx) => (
                      <span key={idx} className={`doc-badge ${doc.verificationStatus}`}>
                        {doc.type}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-right">
                <button
                  className="btn btn-success"
                  onClick={() => handleApprove(car._id)}
                  disabled={processing === car._id}
                >
                  {processing === car._id ? '...' : '✓ Approve'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => openRejectModal(car)}
                  disabled={processing === car._id}
                >
                  ✕ Reject
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedCar(selectedCar?._id === car._id ? null : car)}
                >
                  {selectedCar?._id === car._id ? 'Hide Details' : 'View Details'}
                </button>
              </div>

              {selectedCar?._id === car._id && !showRejectModal && (
                <div className="expanded-details">
                  <div className="detail-section">
                    <h4>Description</h4>
                    <p>{car.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Features</h4>
                    <div className="features-list">
                      {car.features?.map((feature, idx) => (
                        <span key={idx} className="feature-tag">{feature}</span>
                      )) || 'No features listed'}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Specifications</h4>
                    <div className="specs-grid">
                      <div>
                        <label>Mileage</label>
                        <span>{car.specifications?.mileage || 'N/A'} miles</span>
                      </div>
                      <div>
                        <label>Seats</label>
                        <span>{car.specifications?.seats || 'N/A'}</span>
                      </div>
                      <div>
                        <label>Doors</label>
                        <span>{car.specifications?.doors || 'N/A'}</span>
                      </div>
                      <div>
                        <label>Engine</label>
                        <span>{car.specifications?.engine || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {car.documents?.length > 0 && (
                    <div className="detail-section">
                      <h4>Uploaded Documents</h4>
                      <div className="documents-grid">
                        {car.documents.map((doc, idx) => (
                          <div key={idx} className="doc-item">
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              📄 {doc.type}
                            </a>
                            <span className={`status ${doc.verificationStatus}`}>
                              {doc.verificationStatus}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Car Listing</h3>
              <button className="close-btn" onClick={() => setShowRejectModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-content">
              <p>
                You are about to reject the listing for{' '}
                <strong>{selectedCar?.make} {selectedCar?.model}</strong>
              </p>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingCarsAdmin;
