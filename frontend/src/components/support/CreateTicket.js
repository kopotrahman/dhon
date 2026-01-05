import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supportAPI } from '../../utils/api';
import './Support.css';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      setError('Subject and description are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await supportAPI.createTicket(formData);
      navigate('/support');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket-container">
      <div className="page-header">
        <h1>Create Support Ticket</h1>
        <p>Describe your issue and we'll get back to you soon</p>
      </div>

      <form onSubmit={handleSubmit} className="ticket-form">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="subject">Subject *</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Brief summary of your issue"
            maxLength={200}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="general">General Inquiry</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing & Payment</option>
              <option value="complaint">Complaint</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority *</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Please provide detailed information about your issue..."
            rows="6"
            maxLength={2000}
            required
          />
          <span className="char-count">{formData.description.length}/2000</span>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancel"
            onClick={() => navigate('/support')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
