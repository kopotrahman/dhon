import React, { useState, useRef } from 'react';
import { carAPI } from '../../utils/api';
import './Documents.css';

const DocumentUpload = ({ carId, onSuccess, existingDocuments = [] }) => {
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('registration');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const documentTypes = [
    { value: 'registration', label: 'Registration Certificate (RC)', icon: '📋' },
    { value: 'insurance', label: 'Insurance Certificate', icon: '🛡️' },
    { value: 'permit', label: 'Permit', icon: '📄' },
    { value: 'fitness', label: 'Fitness Certificate', icon: '✅' },
    { value: 'pollution', label: 'Pollution Certificate (PUC)', icon: '🌿' },
    { value: 'license', label: 'Driving License', icon: '🪪' },
    { value: 'other', label: 'Other Document', icon: '📎' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image (JPG, PNG) or PDF file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError('');

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!expiryDate) {
      setError('Please set the expiry date');
      return;
    }

    // Check if document type already exists
    const existingDoc = existingDocuments.find(doc => doc.type === documentType);
    if (existingDoc) {
      const confirmReplace = window.confirm(
        `A ${documentTypes.find(d => d.value === documentType)?.label} already exists. Do you want to replace it?`
      );
      if (!confirmReplace) return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('type', documentType);
      formData.append('expiryDate', expiryDate);

      await carAPI.uploadDocument(carId, formData);
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setExpiryDate('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onSuccess && onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="document-upload-container">
      <h3>📤 Upload Document</h3>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleUpload}>
        <div className="form-group">
          <label>Document Type *</label>
          <select 
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Expiry Date *</label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          <small>Document will be tracked for expiry reminders</small>
        </div>

        <div className="file-upload-area">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            id="document-file"
          />
          
          {!selectedFile ? (
            <label htmlFor="document-file" className="file-upload-label">
              <span className="upload-icon">📁</span>
              <span>Click to select or drag and drop</span>
              <span className="file-types">JPG, PNG, or PDF (max 5MB)</span>
            </label>
          ) : (
            <div className="file-preview">
              {preview ? (
                <img src={preview} alt="Document preview" />
              ) : (
                <div className="pdf-preview">
                  <span className="pdf-icon">📄</span>
                  <span>PDF Document</span>
                </div>
              )}
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
                <button 
                  type="button" 
                  className="clear-btn"
                  onClick={clearSelection}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={uploading || !selectedFile}
        >
          {uploading ? (
            <>
              <span className="spinner"></span> Uploading...
            </>
          ) : (
            '📤 Upload Document'
          )}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload;
