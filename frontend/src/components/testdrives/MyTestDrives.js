import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './TestDrives.css';

const MyTestDrives = () => {
  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedTestDrive, setSelectedTestDrive] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '', wouldRecommend: true });

  useEffect(() => {
    fetchTestDrives();
  }, [filter]);

  const fetchTestDrives = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await api.get(`/test-drives/my?${params}`);
      setTestDrives(response.data.testDrives || response.data);
    } catch (error) {
      console.error('Error fetching test drives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (testDriveId) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      await api.patch(`/test-drives/${testDriveId}/cancel`, { reason });
      fetchTestDrives();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to cancel test drive');
    }
  };

  const handleReschedule = async (testDriveId) => {
    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newTime = prompt('Enter new time (HH:MM):');
    
    if (!newDate || !newTime) return;

    try {
      await api.patch(`/test-drives/${testDriveId}/reschedule`, {
        newDate,
        newTime,
      });
      fetchTestDrives();
      alert('Rescheduling request submitted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reschedule test drive');
    }
  };

  const openFeedbackModal = (testDrive) => {
    setSelectedTestDrive(testDrive);
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!selectedTestDrive) return;

    try {
      await api.post(`/test-drives/${selectedTestDrive._id}/feedback`, feedback);
      setShowFeedbackModal(false);
      setFeedback({ rating: 5, comment: '', wouldRecommend: true });
      fetchTestDrives();
      alert('Thank you for your feedback!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#d97706' },
      confirmed: { bg: '#dbeafe', color: '#2563eb' },
      completed: { bg: '#d1fae5', color: '#059669' },
      cancelled: { bg: '#fee2e2', color: '#ef4444' },
      'no-show': { bg: '#f3f4f6', color: '#6b7280' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {status}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="my-test-drives-container">
      <div className="page-header">
        <h1>My Test Drives</h1>
        <p>Manage your scheduled test drives</p>
      </div>

      <div className="filter-tabs">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            className={filter === status ? 'active' : ''}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading test drives...</div>
      ) : testDrives.length === 0 ? (
        <div className="no-test-drives">
          <div className="icon">🚗</div>
          <h2>No Test Drives Found</h2>
          <p>
            {filter === 'all'
              ? "You haven't scheduled any test drives yet."
              : `No ${filter} test drives found.`}
          </p>
          <Link to="/cars" className="btn-primary">
            Browse Cars
          </Link>
        </div>
      ) : (
        <div className="test-drives-list">
          {testDrives.map((testDrive) => (
            <div key={testDrive._id} className="test-drive-card">
              <div className="card-header">
                <div className="car-info">
                  <div className="car-image">
                    {testDrive.car?.images?.[0] ? (
                      <img src={testDrive.car.images[0]} alt={testDrive.car.title} />
                    ) : (
                      <div className="placeholder">🚗</div>
                    )}
                  </div>
                  <div className="car-details">
                    <h3>
                      <Link to={`/car/${testDrive.car?._id}`}>
                        {testDrive.car?.year} {testDrive.car?.make} {testDrive.car?.model}
                      </Link>
                    </h3>
                    <p className="location">{testDrive.location?.address || 'Location TBD'}</p>
                  </div>
                </div>
                {getStatusBadge(testDrive.status)}
              </div>

              <div className="schedule-info">
                <div className="schedule-item">
                  <span className="label">📅 Date</span>
                  <span className="value">{formatDate(testDrive.scheduledDate)}</span>
                </div>
                <div className="schedule-item">
                  <span className="label">🕐 Time</span>
                  <span className="value">{testDrive.scheduledTime}</span>
                </div>
                <div className="schedule-item">
                  <span className="label">⏱️ Duration</span>
                  <span className="value">{testDrive.duration || 30} minutes</span>
                </div>
              </div>

              {testDrive.notes && (
                <div className="notes">
                  <strong>Notes:</strong> {testDrive.notes}
                </div>
              )}

              {testDrive.status === 'confirmed' && testDrive.confirmationDetails && (
                <div className="confirmation-details">
                  <h4>Meeting Details</h4>
                  <p><strong>Contact:</strong> {testDrive.confirmationDetails.contactPerson}</p>
                  <p><strong>Phone:</strong> {testDrive.confirmationDetails.contactPhone}</p>
                  {testDrive.confirmationDetails.instructions && (
                    <p><strong>Instructions:</strong> {testDrive.confirmationDetails.instructions}</p>
                  )}
                </div>
              )}

              <div className="card-actions">
                {testDrive.status === 'pending' && (
                  <>
                    <button
                      className="btn-reschedule"
                      onClick={() => handleReschedule(testDrive._id)}
                    >
                      Reschedule
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancel(testDrive._id)}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {testDrive.status === 'confirmed' && (
                  <>
                    <button
                      className="btn-reschedule"
                      onClick={() => handleReschedule(testDrive._id)}
                    >
                      Request Reschedule
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancel(testDrive._id)}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {testDrive.status === 'completed' && !testDrive.feedback && (
                  <button
                    className="btn-feedback"
                    onClick={() => openFeedbackModal(testDrive)}
                  >
                    Leave Feedback
                  </button>
                )}

                {testDrive.status === 'completed' && testDrive.feedback && (
                  <div className="feedback-given">
                    <span>✓ Feedback submitted</span>
                    <span className="rating">{'★'.repeat(testDrive.feedback.rating)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Test Drive Feedback</h2>
            <p className="modal-subtitle">
              How was your test drive experience with the{' '}
              {selectedTestDrive?.car?.year} {selectedTestDrive?.car?.make} {selectedTestDrive?.car?.model}?
            </p>

            <div className="form-group">
              <label>Rating</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${feedback.rating >= star ? 'active' : ''}`}
                    onClick={() => setFeedback({ ...feedback, rating: star })}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Comments</label>
              <textarea
                value={feedback.comment}
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                placeholder="Share your experience..."
                rows="4"
              />
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="recommend"
                checked={feedback.wouldRecommend}
                onChange={(e) => setFeedback({ ...feedback, wouldRecommend: e.target.checked })}
              />
              <label htmlFor="recommend">I would recommend this car to others</label>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowFeedbackModal(false)}>Cancel</button>
              <button className="primary" onClick={submitFeedback}>
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTestDrives;
