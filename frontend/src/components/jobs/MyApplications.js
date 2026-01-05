import React, { useState, useEffect } from 'react';
import { jobAPI } from '../../utils/api';
import './Jobs.css';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [signingContract, setSigningContract] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getMyApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    
    try {
      await jobAPI.withdrawApplication(applicationId);
      setMessage({ type: 'success', text: 'Application withdrawn successfully' });
      loadApplications();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to withdraw application' });
    }
  };

  const handleSignContract = async (applicationId) => {
    try {
      setSigningContract(true);
      await jobAPI.signContract(applicationId, { signatureUrl: signatureData || 'e-signature' });
      setMessage({ type: 'success', text: 'Contract signed successfully!' });
      setSelectedApplication(null);
      loadApplications();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to sign contract' });
    } finally {
      setSigningContract(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f0ad4e',
      shortlisted: '#5bc0de',
      interview_scheduled: '#5cb85c',
      interview_completed: '#337ab7',
      accepted: '#28a745',
      rejected: '#d9534f',
      withdrawn: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '⏳ Pending Review',
      shortlisted: '⭐ Shortlisted',
      interview_scheduled: '📅 Interview Scheduled',
      interview_completed: '✅ Interview Completed',
      accepted: '🎉 Hired!',
      rejected: '❌ Not Selected',
      withdrawn: '🔙 Withdrawn'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="loading">Loading your applications...</div>;
  }

  return (
    <div className="my-applications">
      <h2>📋 My Job Applications</h2>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="no-applications">
          <p>You haven't applied to any jobs yet.</p>
          <p>Browse available jobs and apply to start your driving career!</p>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map((application) => (
            <div key={application._id} className="application-card-full">
              <div className="application-header">
                <h3>{application.job?.title}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(application.status) }}
                >
                  {getStatusLabel(application.status)}
                </span>
              </div>

              <div className="job-summary">
                <p><strong>🚗 Car:</strong> {application.job?.carModel}</p>
                <p><strong>📍 Location:</strong> {application.job?.location?.city}</p>
                <p><strong>💰 Salary:</strong> ${application.job?.salary?.amount}/{application.job?.salary?.period}</p>
                <p><strong>📅 Applied:</strong> {new Date(application.appliedAt).toLocaleDateString()}</p>
              </div>

              {/* Interview Details */}
              {application.interview?.scheduledAt && (
                <div className="interview-section">
                  <h4>📅 Interview Details</h4>
                  <p><strong>Date:</strong> {new Date(application.interview.scheduledAt).toLocaleString()}</p>
                  <p><strong>Type:</strong> {application.interview.location?.type?.replace('_', ' ')}</p>
                  
                  {application.interview.location?.type === 'video_call' && application.interview.location?.meetingLink && (
                    <a 
                      href={application.interview.location.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      Join Video Call
                    </a>
                  )}
                  
                  {application.interview.location?.type === 'in_person' && (
                    <p><strong>Address:</strong> {application.interview.location.address}</p>
                  )}
                  
                  {application.interview.notes && (
                    <p><strong>Notes:</strong> {application.interview.notes}</p>
                  )}
                </div>
              )}

              {/* Contract Section */}
              {application.contract?.status && application.contract.status !== 'not_created' && (
                <div className="contract-section">
                  <h4>📝 Contract</h4>
                  
                  {application.contract.status === 'pending_driver' && (
                    <div className="pending-signature">
                      <p>🖊️ Your signature is required!</p>
                      <div className="contract-terms">
                        <p><strong>Salary:</strong> ${application.contract.terms?.salary}/{application.contract.terms?.salaryPeriod}</p>
                        <p><strong>Start Date:</strong> {new Date(application.contract.terms?.startDate).toLocaleDateString()}</p>
                        <p><strong>Working Hours:</strong> {application.contract.terms?.workingHours}</p>
                        {application.contract.terms?.benefits?.length > 0 && (
                          <div>
                            <strong>Benefits:</strong>
                            <ul>
                              {application.contract.terms.benefits.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button 
                        className="btn btn-success"
                        onClick={() => setSelectedApplication(application)}
                      >
                        ✍️ Review & Sign Contract
                      </button>
                    </div>
                  )}

                  {application.contract.status === 'pending_owner' && (
                    <p className="awaiting-signature">⏳ Awaiting employer's signature...</p>
                  )}

                  {application.contract.status === 'signed' && (
                    <p className="contract-complete">✅ Contract fully signed!</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="application-actions">
                {['pending', 'shortlisted', 'interview_scheduled'].includes(application.status) && (
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleWithdraw(application._id)}
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contract Signing Modal */}
      {selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>✍️ Sign Employment Contract</h2>
              <button className="close-btn" onClick={() => setSelectedApplication(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="contract-full-terms">
                <h4>Contract Terms</h4>
                <p><strong>Position:</strong> Driver for {selectedApplication.job?.title}</p>
                <p><strong>Salary:</strong> ${selectedApplication.contract?.terms?.salary}/{selectedApplication.contract?.terms?.salaryPeriod}</p>
                <p><strong>Start Date:</strong> {new Date(selectedApplication.contract?.terms?.startDate).toLocaleDateString()}</p>
                {selectedApplication.contract?.terms?.endDate && (
                  <p><strong>End Date:</strong> {new Date(selectedApplication.contract?.terms?.endDate).toLocaleDateString()}</p>
                )}
                <p><strong>Working Hours:</strong> {selectedApplication.contract?.terms?.workingHours}</p>
                
                {selectedApplication.contract?.terms?.responsibilities?.length > 0 && (
                  <div>
                    <strong>Responsibilities:</strong>
                    <ul>
                      {selectedApplication.contract.terms.responsibilities.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <p><strong>Termination:</strong> {selectedApplication.contract?.terms?.terminationClause}</p>
              </div>

              <div className="signature-section">
                <p>By clicking "Sign Contract", you agree to the terms above.</p>
                <input
                  type="text"
                  placeholder="Type your full name as signature"
                  value={signatureData}
                  onChange={(e) => setSignatureData(e.target.value)}
                  className="signature-input"
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedApplication(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-success"
                  onClick={() => handleSignContract(selectedApplication._id)}
                  disabled={signingContract || !signatureData.trim()}
                >
                  {signingContract ? 'Signing...' : '✍️ Sign Contract'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
