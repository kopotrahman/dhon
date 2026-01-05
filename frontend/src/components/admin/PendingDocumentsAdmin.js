import React, { useState, useEffect } from 'react';
import { carAPI } from '../../utils/api';
import './Admin.css';

const PendingDocumentsAdmin = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  useEffect(() => {
    loadPendingDocuments();
  }, []);

  const loadPendingDocuments = async () => {
    setLoading(true);
    try {
      const response = await carAPI.getPendingDocuments();
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading pending documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (carId, documentId, approved, reason = '') => {
    setProcessing(documentId);
    try {
      await carAPI.verifyDocument(carId, documentId, {
        status: approved ? 'verified' : 'rejected',
        reason
      });
      loadPendingDocuments();
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedDoc(null);
    } catch (error) {
      console.error('Error verifying document:', error);
      alert(error.response?.data?.message || 'Failed to verify document');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectModal = (doc) => {
    setSelectedDoc(doc);
    setShowRejectModal(true);
  };

  const documentTypes = {
    registration: { label: 'Registration Certificate', icon: '📋' },
    insurance: { label: 'Insurance', icon: '🛡️' },
    permit: { label: 'Permit', icon: '📄' },
    fitness: { label: 'Fitness Certificate', icon: '✅' },
    pollution: { label: 'PUC Certificate', icon: '🌿' },
    license: { label: 'Driving License', icon: '🪪' },
    other: { label: 'Other', icon: '📎' }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group documents by car
  const groupedByCar = documents.reduce((acc, item) => {
    const carKey = item.car?._id || 'unknown';
    if (!acc[carKey]) {
      acc[carKey] = {
        car: item.car,
        documents: []
      };
    }
    acc[carKey].documents.push(item);
    return acc;
  }, {});

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>📄 Pending Document Verification</h1>
        <p>Review and verify or reject uploaded documents</p>
        <span className="badge">{documents.length} pending</span>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading pending documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <h3>All documents verified!</h3>
          <p>No pending document verifications at this time.</p>
        </div>
      ) : (
        <div className="documents-by-car">
          {Object.values(groupedByCar).map(({ car, documents: carDocs }) => (
            <div key={car?._id} className="car-section">
              <div className="car-section-header">
                <div className="car-info">
                  {car?.images?.[0] && (
                    <img src={car.images[0]} alt={`${car.make} ${car.model}`} />
                  )}
                  <div>
                    <h3>{car?.make} {car?.model} ({car?.year})</h3>
                    <p className="plate">{car?.licensePlate}</p>
                    <p className="owner">👤 {car?.owner?.name}</p>
                  </div>
                </div>
                <span className="doc-count">{carDocs.length} document(s)</span>
              </div>

              <div className="documents-list">
                {carDocs.map((doc) => {
                  const docType = documentTypes[doc.type] || documentTypes.other;
                  
                  return (
                    <div key={doc._id} className="document-item">
                      <div className="doc-preview" onClick={() => setViewingDoc(doc)}>
                        {doc.url?.endsWith('.pdf') ? (
                          <div className="pdf-thumb">📄 PDF</div>
                        ) : (
                          <img src={doc.url} alt={docType.label} />
                        )}
                      </div>

                      <div className="doc-info">
                        <div className="doc-type">
                          <span className="icon">{docType.icon}</span>
                          <span className="label">{docType.label}</span>
                        </div>
                        <div className="doc-meta">
                          <span>📅 Uploaded: {formatDate(doc.uploadedAt)}</span>
                          <span>⏳ Expires: {formatDate(doc.expiryDate)}</span>
                        </div>
                      </div>

                      <div className="doc-actions">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleVerify(car._id, doc._id, true)}
                          disabled={processing === doc._id}
                        >
                          {processing === doc._id ? '...' : '✓ Verify'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => openRejectModal({ ...doc, carId: car._id })}
                          disabled={processing === doc._id}
                        >
                          ✕ Reject
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setViewingDoc(doc)}
                        >
                          👁️ View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="modal-overlay" onClick={() => setViewingDoc(null)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {documentTypes[viewingDoc.type]?.icon}{' '}
                {documentTypes[viewingDoc.type]?.label}
              </h3>
              <button className="close-btn" onClick={() => setViewingDoc(null)}>
                &times;
              </button>
            </div>
            <div className="modal-content document-viewer">
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
              <div className="doc-details">
                <span>Expires: {formatDate(viewingDoc.expiryDate)}</span>
              </div>
              <div className="modal-actions">
                <a
                  href={viewingDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  📥 Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Document</h3>
              <button className="close-btn" onClick={() => setShowRejectModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-content">
              <p>
                You are about to reject the{' '}
                <strong>{documentTypes[selectedDoc?.type]?.label}</strong> document.
              </p>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection (e.g., blurry image, expired document, etc.)..."
                  rows={4}
                />
              </div>
              <div className="common-reasons">
                <p>Common reasons:</p>
                <div className="reason-chips">
                  {[
                    'Image is blurry or unreadable',
                    'Document appears to be expired',
                    'Wrong document type uploaded',
                    'Document is incomplete',
                    'Suspected forgery'
                  ].map((reason, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="reason-chip"
                      onClick={() => setRejectionReason(reason)}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleVerify(
                  selectedDoc.carId, 
                  selectedDoc._id, 
                  false, 
                  rejectionReason
                )}
                disabled={processing || !rejectionReason.trim()}
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingDocumentsAdmin;
