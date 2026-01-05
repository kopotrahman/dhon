import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './Vendor.css';

const VendorRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    category: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    bankAccount: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      routingNumber: '',
    },
    taxId: '',
    website: '',
    agreeToTerms: false,
  });
  const [documents, setDocuments] = useState({
    businessLicense: null,
    taxDocument: null,
    idDocument: null,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setDocuments(prev => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.agreeToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      // First, register the vendor
      const vendorData = {
        businessInfo: {
          businessName: formData.businessName,
          description: formData.description,
          category: formData.category,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          website: formData.website,
        },
        bankDetails: formData.bankAccount,
        taxId: formData.taxId,
      };

      const response = await api.post('/vendors/register', vendorData);

      // Upload documents if any
      const formDataUpload = new FormData();
      if (documents.businessLicense) {
        formDataUpload.append('documents', documents.businessLicense);
      }
      if (documents.taxDocument) {
        formDataUpload.append('documents', documents.taxDocument);
      }
      if (documents.idDocument) {
        formDataUpload.append('documents', documents.idDocument);
      }

      if (formDataUpload.has('documents')) {
        await api.post('/vendors/documents', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      alert('Vendor registration submitted successfully! You will be notified once approved.');
      navigate('/vendor/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.response?.data?.message || 'Failed to register as vendor');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="vendor-register-container">
      <div className="register-header">
        <h1>Become a Vendor</h1>
        <p>Start selling your products on our marketplace</p>
      </div>

      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Business Info</span>
        </div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Contact & Address</span>
        </div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Payment Info</span>
        </div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">Documents</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="vendor-form">
        {step === 1 && (
          <div className="form-step">
            <h2>Business Information</h2>
            
            <div className="form-group">
              <label>Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                placeholder="Your business name"
              />
            </div>

            <div className="form-group">
              <label>Business Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                <option value="auto-parts">Auto Parts</option>
                <option value="accessories">Accessories</option>
                <option value="electronics">Electronics</option>
                <option value="tools">Tools & Equipment</option>
                <option value="tires">Tires & Wheels</option>
                <option value="fluids">Fluids & Lubricants</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Business Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Tell us about your business..."
              />
            </div>

            <div className="form-group">
              <label>Website (optional)</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourbusiness.com"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={nextStep} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>Contact & Address</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Business Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="business@email.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Street Address *</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                required
                placeholder="123 Business St"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>State/Province *</label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ZIP/Postal Code *</label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Country *</label>
                <input
                  type="text"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={prevStep} className="btn-secondary">
                Back
              </button>
              <button type="button" onClick={nextStep} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2>Payment Information</h2>

            <div className="form-group">
              <label>Account Holder Name *</label>
              <input
                type="text"
                name="bankAccount.accountName"
                value={formData.bankAccount.accountName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bank Name *</label>
                <input
                  type="text"
                  name="bankAccount.bankName"
                  value={formData.bankAccount.bankName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Routing Number *</label>
                <input
                  type="text"
                  name="bankAccount.routingNumber"
                  value={formData.bankAccount.routingNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Account Number *</label>
              <input
                type="text"
                name="bankAccount.accountNumber"
                value={formData.bankAccount.accountNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Tax ID / EIN (optional)</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="XX-XXXXXXX"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={prevStep} className="btn-secondary">
                Back
              </button>
              <button type="button" onClick={nextStep} className="btn-primary">
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="form-step">
            <h2>Upload Documents</h2>
            <p className="step-description">
              Please upload the required documents for verification.
            </p>

            <div className="form-group file-upload">
              <label>Business License</label>
              <input
                type="file"
                name="businessLicense"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {documents.businessLicense && (
                <span className="file-name">{documents.businessLicense.name}</span>
              )}
            </div>

            <div className="form-group file-upload">
              <label>Tax Document</label>
              <input
                type="file"
                name="taxDocument"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {documents.taxDocument && (
                <span className="file-name">{documents.taxDocument.name}</span>
              )}
            </div>

            <div className="form-group file-upload">
              <label>ID Document (Passport or Driver's License)</label>
              <input
                type="file"
                name="idDocument"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              {documents.idDocument && (
                <span className="file-name">{documents.idDocument.name}</span>
              )}
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                id="agreeToTerms"
              />
              <label htmlFor="agreeToTerms">
                I agree to the <a href="/terms/vendor" target="_blank">Vendor Terms & Conditions</a>
              </label>
            </div>

            <div className="form-actions">
              <button type="button" onClick={prevStep} className="btn-secondary">
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default VendorRegister;
