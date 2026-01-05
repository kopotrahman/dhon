import React, { useState, useEffect } from 'react';
import { jobAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import './Jobs.css';

const JobList = ({ onSelectJob, onCreateJob }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', location: '', carModel: '' });
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my-jobs'

  useEffect(() => {
    loadJobs();
  }, [filter, viewMode]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      let response;
      if (viewMode === 'my-jobs' && user?.role === 'owner') {
        response = await jobAPI.getMyJobs(filter);
      } else {
        response = await jobAPI.getJobs({ ...filter, status: filter.status || 'open' });
      }
      setJobs(response.data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'badge-success',
      closed: 'badge-secondary',
      filled: 'badge-info',
      cancelled: 'badge-danger',
      draft: 'badge-warning'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading jobs...</div>;
  }

  return (
    <div className="job-list">
      <div className="job-list-header">
        <h2>🚘 Driver Jobs</h2>
        {user?.role === 'owner' && (
          <button className="btn btn-primary" onClick={onCreateJob}>
            + Post New Job
          </button>
        )}
      </div>

      {user?.role === 'owner' && (
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            All Jobs
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'my-jobs' ? 'active' : ''}`}
            onClick={() => setViewMode('my-jobs')}
          >
            My Posted Jobs
          </button>
        </div>
      )}

      <div className="filters">
        <input
          type="text"
          name="location"
          placeholder="Filter by location..."
          value={filter.location}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="carModel"
          placeholder="Filter by car model..."
          value={filter.carModel}
          onChange={handleFilterChange}
        />
        <select name="status" value={filter.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="filled">Filled</option>
        </select>
      </div>

      <div className="jobs-grid">
        {jobs.length === 0 ? (
          <div className="no-jobs">No jobs found matching your criteria.</div>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="job-card" onClick={() => onSelectJob(job)}>
              <div className="job-card-header">
                <h3>{job.title}</h3>
                <span className={`badge ${getStatusBadge(job.status)}`}>
                  {job.status}
                </span>
              </div>
              
              <div className="job-info">
                <p><strong>📍 Location:</strong> {job.location?.city || 'Not specified'}</p>
                <p><strong>🚗 Car:</strong> {job.carModel}</p>
                <p><strong>💰 Salary:</strong> ${job.salary?.amount}/{job.salary?.period}</p>
                {job.salary?.negotiable && <span className="negotiable-tag">Negotiable</span>}
              </div>

              <div className="job-meta">
                <span>📅 Start: {new Date(job.startDate).toLocaleDateString()}</span>
                {job.isUrgent && <span className="urgent-tag">🔥 Urgent</span>}
              </div>

              {viewMode === 'my-jobs' && (
                <div className="applications-count">
                  <span>📝 {job.applications?.length || 0} applications</span>
                </div>
              )}

              <div className="job-card-footer">
                <span className="posted-date">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
                <button className="btn btn-outline">View Details →</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobList;
