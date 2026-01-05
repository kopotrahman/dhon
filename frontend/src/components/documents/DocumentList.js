import React, { useState } from 'react';
import { carAPI } from '../../utils/api';
import './Documents.css';

const DocumentList = ({ carId, documents, isOwner, onUpdate }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  const documentTypes = {
    registration: { label: 'Registration Certificate', icon: '📋' },
    insurance: { label: 'Insurance', icon: '🛡️' },
    permit: { label: 'Permit', icon: '📄' },
    fitness: { label: 'Fitness Certificate', icon: '✅' },
    pollution: { label: 'PUC Certificate', icon: '🌿' },
    license: { label: 'Driving License', icon: '🪪' },
    other: { label: 'Other', icon: '📎' }
  };

  const getStatusBadge = (doc) => {
    const now = new Date();
    const expiryDate = new Date(doc.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (doc.verificationStatus === 'rejected') {
      return { class: 'rejected', text: '❌ Rejected', color: '#dc2626' };
    }
    if (daysUntilExpiry <= 0) {
      return { class: 'expired', text: '⚠️ Expired', color: '#dc2626' };
    }
    if (daysUntilExpiry <= 7) {
      return { class: 'expiring-soon', text: `⚠️ Expires in ${daysUntilExpiry}d`, color: '#d97706' };
    }
    if (daysUntilExpiry <= 30) {
      return { class: 'expiring', text: `📅 Expires in ${daysUntilExpiry}d`, color: '#eab308' };
    }
    if (doc.verificationStatus === 'verified') {
      return { class: 'verified', text: '✅ Verified', color: '#059669' };
    }
    return { class: 'pending', text: '⏳ Pending Verification', color: '#64748b' };
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(documentId);
    try {
      await carAPI.deleteDocument(carId, documentId);
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="documents-empty">
        <span className="empty-icon">📂</span>
        <h4>No documents uploaded</h4>
        <p>Upload car documents to get verified and start accepting bookings</p>
      </div>
    );
  }

  return (
    <div className="document-list-container">
      <div className="documents-grid">
        {documents.map((doc) => {
          const docType = documentTypes[doc.type] || documentTypes.other;
          const status = getStatusBadge(doc);

          return (
            <div key={doc._id} className={`document-card ${status.class}`}>
              <div className="document-header">
                <div className="document-type">
                  <span className="type-icon">{docType.icon}</span>
                  <span className="type-label">{docType.label}</span>
                </div>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: `${status.color}20`, color: status.color }}
                >
                  {status.text}
                </span>
              </div>

              <div className="document-preview" onClick={() => setViewingDoc(doc)}>
                {doc.url?.endsWith('.pdf') ? (
                  <div className="pdf-thumbnail">
                    <span>📄</span>
                    <span>PDF</span>
                  </div>
                ) : (
                  <img src={doc.url} alt={docType.label} />
                )}
                <div className="preview-overlay">
                  <span>👁️ View</span>
                </div>
              </div>

              <div className="document-details">
                <div className="detail-row">
                  <span className="label">Uploaded:</span>
                  <span className="value">{formatDate(doc.uploadedAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Expires:</span>
                  <span className="value">{formatDate(doc.expiryDate)}</span>
                </div>
                {doc.verifiedAt && (
                  <div className="detail-row">
                    <span className="label">Verified:</span>
                    <span className="value">{formatDate(doc.verifiedAt)}</span>
                  </div>
                )}
              </div>

              {doc.rejectionReason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong>
                  <p>{doc.rejectionReason}</p>
                </div>
              )}

              {isOwner && (
                <div className="document-actions">
                  <button 
                    className="btn btn-sm btn-outline"
                    onClick={() => setViewingDoc(doc)}
                  >
                    👁️ View
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(doc._id)}
                    disabled={deletingId === doc._id}
                  >
                    {deletingId === doc._id ? '...' : '🗑️ Delete'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="document-modal-overlay" onClick={() => setViewingDoc(null)}>
          <div className="document-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {documentTypes[viewingDoc.type]?.icon} {documentTypes[viewingDoc.type]?.label}
              </h3>
              <button className="close-btn" onClick={() => setViewingDoc(null)}>
                &times;
              </button>
            </div>
            <div className="modal-content">
              {viewingDoc.url?.endsWith('.pdf') ? (
                <iframe
                  src={viewingDoc.url}
                  title="Document viewer"
                  className="pdf-viewer"
                />
              ) : (
                <img src={viewingDoc.url} alt="Document" className="full-image" />
              )}
            </div>
            <div className="modal-footer">
              <div className="doc-info">
                <span>Expires: {formatDate(viewingDoc.expiryDate)}</span>
                <span className="status-badge" style={{ 
                  backgroundColor: `${getStatusBadge(viewingDoc).color}20`,
                  color: getStatusBadge(viewingDoc).color
                }}>
                  {getStatusBadge(viewingDoc).text}
                </span>
              </div>
              <a 
                href={viewingDoc.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                📥 Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
