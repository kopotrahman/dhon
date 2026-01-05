import React, { useState } from 'react';
import { jobAPI } from '../../utils/api';
import './Jobs.css';

const ContractModal = ({ application, job, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    salary: job.salary?.amount || '',
    salaryPeriod: job.salary?.period || 'monthly',
    startDate: job.startDate?.split('T')[0] || '',
    endDate: job.endDate?.split('T')[0] || '',
    workingHours: `${job.workingHours?.start || ''} - ${job.workingHours?.end || ''}`,
    benefits: job.benefits?.join('\n') || '',
    responsibilities: job.requirements?.join('\n') || '',
    terminationClause: 'Either party may terminate this agreement with 2 weeks written notice.',
    expiresIn: 7 // days until contract expires
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
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expiresIn));

      await jobAPI.createContract(application._id, {
        terms: {
          salary: parseFloat(formData.salary),
          salaryPeriod: formData.salaryPeriod,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          workingHours: formData.workingHours,
          benefits: formData.benefits.split('\n').filter(b => b.trim()),
          responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
          terminationClause: formData.terminationClause
        },
        expiresAt: expiresAt.toISOString()
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <h2>📝 Create Employment Contract</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="contract-parties">
            <div className="party">
              <h4>Employer</h4>
              <p>{job.owner?.name}</p>
            </div>
            <div className="party-divider">⟷</div>
            <div className="party">
              <h4>Driver</h4>
              <p>{application.driver?.name}</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Salary Amount *</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Period *</label>
                <select name="salaryPeriod" value={formData.salaryPeriod} onChange={handleChange}>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date (if applicable)</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Working Hours</label>
              <input
                type="text"
                name="workingHours"
                value={formData.workingHours}
                onChange={handleChange}
                placeholder="e.g., 9:00 AM - 6:00 PM"
              />
            </div>

            <div className="form-group">
              <label>Benefits (one per line)</label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows={4}
                placeholder="Health insurance&#10;Paid time off&#10;Fuel allowance"
              />
            </div>

            <div className="form-group">
              <label>Responsibilities (one per line)</label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                rows={4}
                placeholder="Drive safely and follow traffic rules&#10;Maintain the vehicle&#10;Be punctual"
              />
            </div>

            <div className="form-group">
              <label>Termination Clause</label>
              <textarea
                name="terminationClause"
                value={formData.terminationClause}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Contract Valid For (days)</label>
              <select name="expiresIn" value={formData.expiresIn} onChange={handleChange}>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
              <small>The driver must sign within this period</small>
            </div>

            <div className="contract-preview">
              <h4>Contract Preview</h4>
              <div className="preview-content">
                <p>This employment agreement is entered into between <strong>{job.owner?.name}</strong> (Employer) 
                and <strong>{application.driver?.name}</strong> (Driver).</p>
                <p><strong>Compensation:</strong> ${formData.salary} per {formData.salaryPeriod}</p>
                <p><strong>Duration:</strong> {formData.startDate} to {formData.endDate || 'Ongoing'}</p>
                <p><strong>Working Hours:</strong> {formData.workingHours}</p>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create & Send Contract'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContractModal;
