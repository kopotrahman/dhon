import React from 'react';
import './Jobs.css';

const ApplicationCard = ({ 
  application, 
  onUpdateStatus, 
  onScheduleInterview, 
  onCreateContract,
  isOwner = false,
  isDriver = false
}) => {
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
      pending: 'Pending Review',
      shortlisted: 'Shortlisted',
      interview_scheduled: 'Interview Scheduled',
      interview_completed: 'Interview Completed',
      accepted: 'Hired',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return labels[status] || status;
  };

  return (
    <div className="application-card">
      <div className="application-header">
        <div className="applicant-info">
          {application.driver?.profileImage ? (
            <img 
              src={application.driver.profileImage} 
              alt={application.driver.name}
              className="applicant-avatar"
            />
          ) : (
            <div className="applicant-avatar-placeholder">
              {application.driver?.name?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <h4>{application.driver?.name}</h4>
            <p>{application.driver?.email}</p>
          </div>
        </div>
        <span 
          className="status-badge"
          style={{ backgroundColor: getStatusColor(application.status) }}
        >
          {getStatusLabel(application.status)}
        </span>
      </div>

      <div className="application-content">
        <div className="cover-letter">
          <h5>Cover Letter</h5>
          <p>{application.coverLetter}</p>
        </div>

        {application.expectedSalary?.amount && (
          <div className="expected-salary">
            <strong>Expected Salary:</strong> ${application.expectedSalary.amount}/{application.expectedSalary.period}
          </div>
        )}

        {/* Interview Details */}
        {application.interview?.scheduledAt && (
          <div className="interview-details">
            <h5>📅 Interview Details</h5>
            <p><strong>Date:</strong> {new Date(application.interview.scheduledAt).toLocaleString()}</p>
            <p><strong>Duration:</strong> {application.interview.duration} minutes</p>
            <p><strong>Type:</strong> {application.interview.location?.type}</p>
            {application.interview.location?.type === 'in_person' && (
              <p><strong>Address:</strong> {application.interview.location.address}</p>
            )}
            {application.interview.location?.type === 'video_call' && (
              <p><strong>Meeting Link:</strong> <a href={application.interview.location.meetingLink} target="_blank" rel="noopener noreferrer">Join Meeting</a></p>
            )}
            {application.interview.notes && (
              <p><strong>Notes:</strong> {application.interview.notes}</p>
            )}
            {application.interview.feedback && (
              <div className="interview-feedback">
                <h6>Feedback</h6>
                <p><strong>Rating:</strong> {'⭐'.repeat(application.interview.feedback.rating)}</p>
                <p>{application.interview.feedback.comments}</p>
              </div>
            )}
          </div>
        )}

        {/* Contract Details */}
        {application.contract?.status && application.contract.status !== 'not_created' && (
          <div className="contract-details">
            <h5>📝 Contract Status</h5>
            <p><strong>Status:</strong> {application.contract.status.replace(/_/g, ' ')}</p>
            {application.contract.signatures?.driver?.signed && (
              <p>✅ Driver signed on {new Date(application.contract.signatures.driver.signedAt).toLocaleDateString()}</p>
            )}
            {application.contract.signatures?.owner?.signed && (
              <p>✅ Owner signed on {new Date(application.contract.signatures.owner.signedAt).toLocaleDateString()}</p>
            )}
          </div>
        )}
      </div>

      {/* Owner Actions */}
      {isOwner && (
        <div className="application-actions">
          {application.status === 'pending' && (
            <>
              <button 
                className="btn btn-sm btn-info"
                onClick={() => onUpdateStatus(application._id, 'shortlisted')}
              >
                Shortlist
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => {
                  const reason = prompt('Rejection reason (optional):');
                  onUpdateStatus(application._id, 'rejected', reason);
                }}
              >
                Reject
              </button>
            </>
          )}

          {application.status === 'shortlisted' && (
            <button 
              className="btn btn-sm btn-primary"
              onClick={onScheduleInterview}
            >
              📅 Schedule Interview
            </button>
          )}

          {application.status === 'interview_completed' && (
            <>
              <button 
                className="btn btn-sm btn-success"
                onClick={onCreateContract}
              >
                📝 Create Contract
              </button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => {
                  const reason = prompt('Rejection reason:');
                  onUpdateStatus(application._id, 'rejected', reason);
                }}
              >
                Reject
              </button>
            </>
          )}

          {application.contract?.status === 'pending_owner' && (
            <button 
              className="btn btn-sm btn-success"
              onClick={() => {/* Sign contract logic */}}
            >
              ✍️ Sign Contract
            </button>
          )}
        </div>
      )}

      <div className="application-footer">
        <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default ApplicationCard;
