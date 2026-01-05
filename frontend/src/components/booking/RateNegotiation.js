import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../../utils/api';
import './Booking.css';

const RateNegotiation = ({ carId, car, onClose, onSuccess }) => {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    proposedRate: '',
    rateType: 'daily',
    startDate: '',
    endDate: '',
    message: ''
  });
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadNegotiations();
  }, []);

  const loadNegotiations = async () => {
    try {
      const response = await bookingAPI.getMyNegotiations();
      const carNegotiations = response.data.filter(n => n.car?._id === carId);
      setNegotiations(carNegotiations);
    } catch (error) {
      console.error('Error loading negotiations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      await bookingAPI.startNegotiation({
        carId,
        proposedRate: parseFloat(formData.proposedRate),
        rateType: formData.rateType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        message: formData.message
      });
      
      setFormData({
        proposedRate: '',
        rateType: 'daily',
        startDate: '',
        endDate: '',
        message: ''
      });
      loadNegotiations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start negotiation');
    } finally {
      setCreating(false);
    }
  };

  const handleSendMessage = async (negotiationId) => {
    if (!replyMessage.trim()) return;

    try {
      await bookingAPI.sendNegotiationMessage(negotiationId, replyMessage);
      setReplyMessage('');
      loadNegotiations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCounterResponse = async (negotiationId, action, newRate = null) => {
    try {
      await bookingAPI.respondToCounterOffer(negotiationId, {
        action,
        newRate,
        message: replyMessage
      });
      setReplyMessage('');
      loadNegotiations();
      
      if (action === 'accept') {
        onSuccess(negotiations.find(n => n._id === negotiationId));
      }
    } catch (error) {
      console.error('Error responding:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: '#fff3cd', color: '#856404', text: 'Pending' },
      accepted: { bg: '#d4edda', color: '#155724', text: 'Accepted' },
      rejected: { bg: '#f8d7da', color: '#721c24', text: 'Rejected' },
      countered: { bg: '#d1ecf1', color: '#0c5460', text: 'Counter Offer' },
      expired: { bg: '#e9ecef', color: '#6c757d', text: 'Expired' }
    };
    return badges[status] || badges.pending;
  };

  const originalRate = formData.rateType === 'hourly' ? car?.rentRates?.hourly : car?.rentRates?.daily;

  return (
    <div className="negotiation-container">
      <div className="negotiation-header">
        <h2>💬 Rate Negotiation</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      <div className="negotiation-content">
        <div className="car-rates-info">
          <h4>{car?.make} {car?.model}</h4>
          <div className="current-rates">
            <span>Current Hourly Rate: <strong>${car?.rentRates?.hourly}</strong></span>
            <span>Current Daily Rate: <strong>${car?.rentRates?.daily}</strong></span>
          </div>
        </div>

        {/* New Negotiation Form */}
        <div className="new-negotiation-section">
          <h3>Start New Negotiation</h3>
          
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Rate Type</label>
                <select 
                  name="rateType" 
                  value={formData.rateType}
                  onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div className="form-group">
                <label>Your Proposed Rate *</label>
                <div className="rate-input-group">
                  <span>$</span>
                  <input
                    type="number"
                    value={formData.proposedRate}
                    onChange={(e) => setFormData({ ...formData, proposedRate: e.target.value })}
                    placeholder={`Current: $${originalRate}`}
                    max={originalRate - 1}
                    required
                  />
                  <span>/{formData.rateType === 'hourly' ? 'hr' : 'day'}</span>
                </div>
                {formData.proposedRate && originalRate && (
                  <small className="savings">
                    💰 {Math.round((1 - formData.proposedRate / originalRate) * 100)}% savings
                  </small>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Message to Owner</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Explain why you're proposing this rate..."
                rows={3}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </form>
        </div>

        {/* Existing Negotiations */}
        <div className="existing-negotiations">
          <h3>Your Negotiations</h3>
          
          {loading ? (
            <div className="loading">Loading...</div>
          ) : negotiations.length === 0 ? (
            <p className="no-negotiations">No active negotiations for this car.</p>
          ) : (
            <div className="negotiations-list">
              {negotiations.map((negotiation) => {
                const badge = getStatusBadge(negotiation.status);
                return (
                  <div key={negotiation._id} className="negotiation-card">
                    <div className="negotiation-card-header">
                      <div>
                        <span className="rate-display">
                          ${negotiation.proposedRate}/{negotiation.rateType === 'hourly' ? 'hr' : 'day'}
                        </span>
                        <span className="original-rate">
                          (Original: ${negotiation.originalRate})
                        </span>
                      </div>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.text}
                      </span>
                    </div>

                    <div className="negotiation-dates">
                      <span>📅 {new Date(negotiation.startDate).toLocaleDateString()}</span>
                      <span>→</span>
                      <span>{new Date(negotiation.endDate).toLocaleDateString()}</span>
                    </div>

                    {/* Counter Offers */}
                    {negotiation.counterOffers?.length > 0 && (
                      <div className="counter-offers">
                        <h5>Counter Offers</h5>
                        {negotiation.counterOffers.map((offer, idx) => (
                          <div key={idx} className="counter-offer">
                            <span>${offer.rate}/{negotiation.rateType === 'hourly' ? 'hr' : 'day'}</span>
                            <span className="offer-date">
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Messages */}
                    {negotiation.messages?.length > 0 && (
                      <div className="negotiation-messages">
                        <h5>Messages</h5>
                        <div className="messages-list">
                          {negotiation.messages.map((msg, idx) => (
                            <div key={idx} className="message">
                              <span className="message-content">{msg.content}</span>
                              <span className="message-date">
                                {new Date(msg.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions for Counter Offer */}
                    {negotiation.status === 'countered' && (
                      <div className="negotiation-actions">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleCounterResponse(negotiation._id, 'accept')}
                        >
                          ✓ Accept Counter
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            const newRate = prompt('Enter your new proposed rate:');
                            if (newRate) {
                              handleCounterResponse(negotiation._id, 'counter', parseFloat(newRate));
                            }
                          }}
                        >
                          ↩ Counter Again
                        </button>
                      </div>
                    )}

                    {/* Reply Section */}
                    {['pending', 'countered'].includes(negotiation.status) && (
                      <div className="reply-section">
                        <input
                          type="text"
                          placeholder="Send a message..."
                          value={selectedNegotiation === negotiation._id ? replyMessage : ''}
                          onChange={(e) => {
                            setSelectedNegotiation(negotiation._id);
                            setReplyMessage(e.target.value);
                          }}
                        />
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSendMessage(negotiation._id)}
                        >
                          Send
                        </button>
                      </div>
                    )}

                    {/* Accepted - Proceed to Book */}
                    {negotiation.status === 'accepted' && (
                      <button 
                        className="btn btn-success"
                        onClick={() => onSuccess(negotiation)}
                      >
                        ✓ Proceed to Book at ${negotiation.proposedRate}/{negotiation.rateType}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateNegotiation;
