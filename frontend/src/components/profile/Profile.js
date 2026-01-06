import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        phone: response.data.phone || '',
        address: response.data.address || ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('address', formData.address);
      
      if (profilePhoto) {
        data.append('profilePhoto', profilePhoto);
      }

      const response = await api.put('/auth/profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(response.data.user);
      setSuccessMessage('Profile updated successfully!');
      setEditing(false);
      setProfilePhoto(null);
      
      // Update local storage with new user data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, ...response.data.user }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setProfilePhoto(null);
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || ''
    });
    setError('');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Carshahajjo</h1>
        <div className="header-actions">
          <Link to="/dashboard" className="btn-back">← Back to Dashboard</Link>
        </div>
      </header>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-card-header">
            <h2>My Profile</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-edit">
                Edit Profile
              </button>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {successMessage && <div className="alert alert-success">{successMessage}</div>}

          <div className="profile-photo-section">
            <div className="profile-photo">
              {profile?.profilePhoto ? (
                <img src={profile.profilePhoto} alt={profile.name} />
              ) : (
                <div className="profile-photo-placeholder">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            {editing && (
              <div className="photo-upload">
                <label htmlFor="profilePhoto" className="btn-upload">
                  Change Photo
                </label>
                <input
                  type="file"
                  id="profilePhoto"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                {profilePhoto && <span className="file-name">{profilePhoto.name}</span>}
              </div>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="disabled"
                />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Full Name</span>
                <span className="info-value">{profile?.name || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{profile?.email || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone</span>
                <span className="info-value">{profile?.phone || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Address</span>
                <span className="info-value">{profile?.address || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Role</span>
                <span className="info-value role-badge">{profile?.role}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Status</span>
                <span className={`info-value status-badge ${profile?.isApproved ? 'approved' : 'pending'}`}>
                  {profile?.isApproved ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Member Since</span>
                <span className="info-value">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {profile?.role === 'driver' && profile?.licenseInfo && (
            <div className="license-section">
              <h3>License Information</h3>
              <div className="info-row">
                <span className="info-label">License Number</span>
                <span className="info-value">{profile.licenseInfo.number || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">License Type</span>
                <span className="info-value">{profile.licenseInfo.type || 'Not set'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Expiry Date</span>
                <span className="info-value">
                  {profile.licenseInfo.expiryDate 
                    ? new Date(profile.licenseInfo.expiryDate).toLocaleDateString() 
                    : 'Not set'}
                </span>
              </div>
            </div>
          )}

          {profile?.role === 'driver' && profile?.kyc && (
            <div className="kyc-section">
              <h3>KYC Verification</h3>
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className={`info-value status-badge ${profile.kyc.isVerified ? 'approved' : 'pending'}`}>
                  {profile.kyc.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
