import React, { useState } from 'react';
import { jobAPI } from '../../utils/api';
import './Jobs.css';

const InterviewModal = ({ application, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    scheduledAt: '',
    duration: 30,
    locationType: 'video_call',
    address: '',
    meetingLink: '',
    phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await jobAPI.scheduleInterview(application._id, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>📅 Schedule Interview</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="applicant-summary">
            <p>Scheduling interview with <strong>{application.driver?.name}</strong></p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date & Time *</label>
              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleChange}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <select name="duration" value={formData.duration} onChange={handleChange}>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
              </select>
            </div>

            <div className="form-group">
              <label>Interview Type *</label>
              <select name="locationType" value={formData.locationType} onChange={handleChange}>
                <option value="video_call">Video Call</option>
                <option value="phone_call">Phone Call</option>
                <option value="in_person">In Person</option>
              </select>
            </div>

            {formData.locationType === 'video_call' && (
              <div className="form-group">
                <label>Meeting Link</label>
                <input
                  type="url"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}

            {formData.locationType === 'phone_call' && (
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone number for the call"
                />
              </div>
            )}

            {formData.locationType === 'in_person' && (
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Interview location address"
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Notes for Candidate</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any instructions or information for the candidate..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewModal;
