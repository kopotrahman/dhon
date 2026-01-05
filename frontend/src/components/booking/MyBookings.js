import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../../utils/api';
import './Booking.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('renter'); // 'renter' or 'owner'
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    loadBookings();
  }, [viewMode]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = viewMode === 'owner' ? { owner: true } : {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await bookingAPI.getBookings(params);
      setBookings(response.data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadBookings();
    }
  }, [filter]);

  const handleStatusUpdate = async (bookingId, status, reason = '') => {
    try {
      await bookingAPI.updateBookingStatus(bookingId, { status, reason });
      loadBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (reason !== null) {
      try {
        await bookingAPI.cancelBooking(bookingId, reason);
        loadBookings();
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert(error.response?.data?.message || 'Failed to cancel booking');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: '#fff3cd', color: '#856404', icon: '⏳', text: 'Pending' },
      confirmed: { bg: '#d4edda', color: '#155724', icon: '✓', text: 'Confirmed' },
      active: { bg: '#cce5ff', color: '#004085', icon: '🚗', text: 'Active' },
      completed: { bg: '#d1ecf1', color: '#0c5460', icon: '✔️', text: 'Completed' },
      cancelled: { bg: '#f8d7da', color: '#721c24', icon: '✕', text: 'Cancelled' },
      rejected: { bg: '#f8d7da', color: '#721c24', icon: '✕', text: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start, end, rateType) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    
    if (rateType === 'hourly') {
      const hours = Math.ceil(diffMs / (1000 * 60 * 60));
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <h1>📅 My Bookings</h1>
        
        <div className="header-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'renter' ? 'active' : ''}`}
              onClick={() => setViewMode('renter')}
            >
              🚗 My Rentals
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'owner' ? 'active' : ''}`}
              onClick={() => setViewMode('owner')}
            >
              🏠 My Cars
            </button>
          </div>

          <div className="filter-tabs">
            {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bookings-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No bookings found</h3>
            <p>
              {viewMode === 'renter' 
                ? "You haven't made any bookings yet." 
                : "No one has booked your cars yet."}
            </p>
          </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map(booking => {
              const badge = getStatusBadge(booking.status);
              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-card-header">
                    <div className="car-info">
                      {booking.car?.images?.[0] && (
                        <img 
                          src={booking.car.images[0]} 
                          alt={`${booking.car.make} ${booking.car.model}`}
                          className="car-thumbnail"
                        />
                      )}
                      <div>
                        <h3>{booking.car?.make} {booking.car?.model} ({booking.car?.year})</h3>
                        <p className="car-plate">{booking.car?.licensePlate}</p>
                      </div>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: badge.bg, color: badge.color }}
                    >
                      {badge.icon} {badge.text}
                    </span>
                  </div>

                  <div className="booking-details">
                    <div className="detail-row">
                      <div className="detail-item">
                        <label>📅 Start</label>
                        <span>{formatDateTime(booking.startDate)}</span>
                      </div>
                      <div className="detail-item">
                        <label>📅 End</label>
                        <span>{formatDateTime(booking.endDate)}</span>
                      </div>
                      <div className="detail-item">
                        <label>⏱️ Duration</label>
                        <span>{calculateDuration(booking.startDate, booking.endDate, booking.rateType)}</span>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <label>📍 Pickup</label>
                        <span>{booking.pickupLocation}</span>
                      </div>
                      <div className="detail-item">
                        <label>📍 Dropoff</label>
                        <span>{booking.dropoffLocation}</span>
                      </div>
                    </div>

                    <div className="detail-row">
                      <div className="detail-item">
                        <label>💵 Rate Type</label>
                        <span className="rate-badge">
                          {booking.rateType === 'hourly' ? '⏰ Hourly' : '📆 Daily'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>💰 Total</label>
                        <span className="total-amount">${booking.totalAmount}</span>
                      </div>
                      {booking.depositAmount > 0 && (
                        <div className="detail-item">
                          <label>🔒 Deposit</label>
                          <span>${booking.depositAmount}</span>
                        </div>
                      )}
                    </div>

                    {booking.driverOption && (
                      <div className="detail-row">
                        <div className="detail-item">
                          <label>👤 Driver</label>
                          <span>
                            {booking.driverOption === 'self' ? 'Self Drive' : 'With Driver'}
                          </span>
                        </div>
                      </div>
                    )}

                    {booking.additionalServices?.length > 0 && (
                      <div className="additional-services-summary">
                        <label>Additional Services:</label>
                        <div className="services-tags">
                          {booking.additionalServices.map((service, idx) => (
                            <span key={idx} className="service-tag">
                              {service.name} (+${service.price})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User info based on view mode */}
                    {viewMode === 'renter' && booking.owner && (
                      <div className="user-info">
                        <label>🏠 Owner</label>
                        <span>{booking.owner.name}</span>
                        <span className="user-contact">{booking.owner.phone}</span>
                      </div>
                    )}
                    {viewMode === 'owner' && booking.user && (
                      <div className="user-info">
                        <label>👤 Renter</label>
                        <span>{booking.user.name}</span>
                        <span className="user-contact">{booking.user.phone}</span>
                      </div>
                    )}

                    {booking.cancellation?.reason && (
                      <div className="cancellation-info">
                        <label>❌ Cancellation Reason</label>
                        <p>{booking.cancellation.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="booking-actions">
                    {/* Renter Actions */}
                    {viewMode === 'renter' && (
                      <>
                        {booking.status === 'pending' && (
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelBooking(booking._id)}
                          >
                            Cancel Booking
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelBooking(booking._id)}
                          >
                            Cancel Booking
                          </button>
                        )}
                        {booking.status === 'completed' && (
                          <button className="btn btn-outline btn-sm">
                            ⭐ Leave Review
                          </button>
                        )}
                      </>
                    )}

                    {/* Owner Actions */}
                    {viewMode === 'owner' && (
                      <>
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                            >
                              ✓ Confirm
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) handleStatusUpdate(booking._id, 'rejected', reason);
                              }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusUpdate(booking._id, 'active')}
                          >
                            🚗 Start Trip
                          </button>
                        )}
                        {booking.status === 'active' && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleStatusUpdate(booking._id, 'completed')}
                          >
                            ✔️ Complete Trip
                          </button>
                        )}
                      </>
                    )}

                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedBooking(
                        selectedBooking === booking._id ? null : booking._id
                      )}
                    >
                      {selectedBooking === booking._id ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {selectedBooking === booking._id && (
                    <div className="expanded-details">
                      <div className="detail-section">
                        <h4>Booking ID</h4>
                        <p className="booking-id">{booking._id}</p>
                      </div>
                      
                      <div className="detail-section">
                        <h4>Created</h4>
                        <p>{formatDateTime(booking.createdAt)}</p>
                      </div>

                      {booking.timeSlots?.length > 0 && (
                        <div className="detail-section">
                          <h4>Time Slots</h4>
                          <div className="time-slots-list">
                            {booking.timeSlots.map((slot, idx) => (
                              <span key={idx} className="time-slot-badge">
                                {slot.date}: {slot.startTime} - {slot.endTime}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {booking.notes && (
                        <div className="detail-section">
                          <h4>Notes</h4>
                          <p>{booking.notes}</p>
                        </div>
                      )}

                      {booking.negotiation && (
                        <div className="detail-section">
                          <h4>Negotiated Rate</h4>
                          <p>
                            Original: ${booking.negotiation.originalRate} → 
                            Final: ${booking.negotiation.proposedRate}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
