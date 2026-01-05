import React, { useState, useEffect } from 'react';
import { jobAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import ApplicationCard from './ApplicationCard';
import InterviewModal from './InterviewModal';
import ContractModal from './ContractModal';
import './Jobs.css';

const JobDetails = ({ job, onBack, onRefresh }) => {
  const { user } = useAuth();
  const [activeJob, setActiveJob] = useState(job);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState({ amount: '', period: 'monthly' });
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isOwner = user?._id === activeJob.owner?._id;
  const isDriver = user?.role === 'driver';

  useEffect(() => {
    loadJobDetails();
  }, [job._id]);

  const loadJobDetails = async () => {
    try {
      const response = await jobAPI.getJobById(job._id);
      setActiveJob(response.data);
    } catch (error) {
      console.error('Error loading job details:', error);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await jobAPI.applyForJob({
        jobId: activeJob._id,
        coverLetter,
        expectedSalary: expectedSalary.amount ? expectedSalary : undefined,
        availability: { isImmediate: true }
      });
      setMessage({ type: 'success', text: 'Application submitted successfully!' });
      setApplying(false);
      loadJobDetails();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit application' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, status, rejectionReason = '') => {
    try {
      await jobAPI.updateApplicationStatus(applicationId, { status, rejectionReason });
      setMessage({ type: 'success', text: `Application ${status} successfully` });
      loadJobDetails();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update status' });
    }
  };

  const handleScheduleInterview = (application) => {
    setSelectedApplication(application);
    setShowInterviewModal(true);
  };

  const handleCreateContract = (application) => {
    setSelectedApplication(application);
    setShowContractModal(true);
  };

  const alreadyApplied = activeJob.applications?.some(
    app => app.driver?._id === user?._id
  );

  return (
    <div className="job-details">
      <button className="btn btn-back" onClick={onBack}>
        ← Back to Jobs
      </button>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div className="job-details-header">
        <div className="job-title-section">
          <h1>{activeJob.title}</h1>
          <span className={`badge badge-${activeJob.status}`}>{activeJob.status}</span>
          {activeJob.isUrgent && <span className="urgent-badge">🔥 Urgent Hiring</span>}
        </div>
        
        <div className="job-owner-info">
          <p>Posted by: <strong>{activeJob.owner?.name}</strong></p>
          <p>📧 {activeJob.owner?.email}</p>
        </div>
      </div>

      <div className="job-details-grid">
        <div className="job-main-info">
          <section className="info-section">
            <h3>📋 Job Description</h3>
            <p>{activeJob.description}</p>
          </section>

          <section className="info-section">
            <h3>📍 Location</h3>
            <p>{activeJob.location?.address}</p>
            <p>{activeJob.location?.city}, {activeJob.location?.state}</p>
          </section>

          <section className="info-section">
            <h3>💰 Compensation</h3>
            <div className="salary-info">
              <span className="salary-amount">${activeJob.salary?.amount}</span>
              <span className="salary-period">/ {activeJob.salary?.period}</span>
              {activeJob.salary?.negotiable && (
                <span className="negotiable-badge">Negotiable</span>
              )}
            </div>
          </section>

          <section className="info-section">
            <h3>🚗 Vehicle Details</h3>
            <p><strong>Car Model:</strong> {activeJob.carModel}</p>
            <p><strong>Car Type:</strong> {activeJob.carType}</p>
          </section>

          <section className="info-section">
            <h3>⏰ Working Hours</h3>
            <p>{activeJob.workingHours?.start} - {activeJob.workingHours?.end}</p>
            <p>{activeJob.workingHours?.daysPerWeek} days per week</p>
          </section>

          <section className="info-section">
            <h3>📅 Duration</h3>
            <p><strong>Start Date:</strong> {new Date(activeJob.startDate).toLocaleDateString()}</p>
            {activeJob.endDate && (
              <p><strong>End Date:</strong> {new Date(activeJob.endDate).toLocaleDateString()}</p>
            )}
          </section>

          {activeJob.requirements?.length > 0 && (
            <section className="info-section">
              <h3>📝 Requirements</h3>
              <ul>
                {activeJob.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {activeJob.benefits?.length > 0 && (
            <section className="info-section">
              <h3>🎁 Benefits</h3>
              <ul>
                {activeJob.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="info-section">
            <h3>📜 License Required</h3>
            <p>{activeJob.licenseRequired || 'Any valid driver\'s license'}</p>
          </section>
        </div>

        <div className="job-sidebar">
          {/* Apply Section for Drivers */}
          {isDriver && activeJob.status === 'open' && !isOwner && (
            <div className="apply-section">
              {alreadyApplied ? (
                <div className="already-applied">
                  <p>✅ You have already applied for this job</p>
                </div>
              ) : applying ? (
                <form onSubmit={handleApply} className="apply-form">
                  <h3>Apply for this Job</h3>
                  <div className="form-group">
                    <label>Cover Letter *</label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Tell the employer why you're a great fit..."
                      required
                      rows={6}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected Salary (Optional)</label>
                    <div className="salary-input">
                      <input
                        type="number"
                        value={expectedSalary.amount}
                        onChange={(e) => setExpectedSalary({ ...expectedSalary, amount: e.target.value })}
                        placeholder="Amount"
                      />
                      <select
                        value={expectedSalary.period}
                        onChange={(e) => setExpectedSalary({ ...expectedSalary, period: e.target.value })}
                      >
                        <option value="hourly">Hourly</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setApplying(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button className="btn btn-primary btn-lg" onClick={() => setApplying(true)}>
                  Apply Now
                </button>
              )}
            </div>
          )}

          {/* Applications Section for Owner */}
          {isOwner && (
            <div className="applications-section">
              <h3>📝 Applications ({activeJob.applications?.length || 0})</h3>
              {activeJob.applications?.length > 0 ? (
                <div className="applications-list">
                  {activeJob.applications.map((application) => (
                    <ApplicationCard
                      key={application._id}
                      application={application}
                      onUpdateStatus={handleUpdateStatus}
                      onScheduleInterview={() => handleScheduleInterview(application)}
                      onCreateContract={() => handleCreateContract(application)}
                      isOwner={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="no-applications">No applications yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interview Modal */}
      {showInterviewModal && selectedApplication && (
        <InterviewModal
          application={selectedApplication}
          onClose={() => {
            setShowInterviewModal(false);
            setSelectedApplication(null);
          }}
          onSuccess={() => {
            loadJobDetails();
            setShowInterviewModal(false);
            setSelectedApplication(null);
          }}
        />
      )}

      {/* Contract Modal */}
      {showContractModal && selectedApplication && (
        <ContractModal
          application={selectedApplication}
          job={activeJob}
          onClose={() => {
            setShowContractModal(false);
            setSelectedApplication(null);
          }}
          onSuccess={() => {
            loadJobDetails();
            setShowContractModal(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </div>
  );
};

export default JobDetails;
