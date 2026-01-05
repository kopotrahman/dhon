import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceCenterAPI, carAPI } from '../../utils/api';
import './Services.css';

const ServiceBooking = () => {
  const { centerId } = useParams();
  const navigate = useNavigate();
  const [center, setCenter] = useState(null);
  const [myCars, setMyCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    carId: '',
    serviceType: '',
    scheduledDate: '',
    notes: ''
  });

  useEffect(() => {
    Promise.all([fetchCenter(), fetchMyCars()]);
  }, [centerId]);

  const fetchCenter = async () => {
    try {
      const response = await serviceCenterAPI.getCenterById(centerId);
      setCenter(response.data);
    } catch (err) {
      setError('Failed to load service center');
    }
  };

  const fetchMyCars = async () => {
    try {
      const response = await carAPI.getMyCars();
      setMyCars(response.data.cars || response.data);
    } catch (err) {
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.carId || !formData.serviceType || !formData.scheduledDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await serviceCenterAPI.bookService(centerId, formData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/services/my-bookings');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book service');
    } finally {
      setSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!center) {
    return <div className="error">Service center not found</div>;
  }

  return (
    <div className="service-booking-container">
      <div className="page-header">
        <h1>Book Service</h1>
        <p>Schedule a service at {center.name}</p>
      </div>

      <div className="booking-content">
        <div className="center-summary">
          <h2>{center.name}</h2>
          <p className="center-address">📍 {center.location?.address}</p>
          <p className="center-phone">📞 {center.contact?.phone}</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Booking Confirmed!</h2>
            <p>Your service has been scheduled successfully.</p>
            <p>Redirecting to your bookings...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="booking-form">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="carId">Select Vehicle *</label>
              {myCars.length === 0 ? (
                <p className="no-cars-message">
                  You don't have any registered vehicles. 
                  <a href="/cars/add">Add a vehicle first</a>
                </p>
              ) : (
                <select
                  id="carId"
                  name="carId"
                  value={formData.carId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a vehicle</option>
                  {myCars.map(car => (
                    <option key={car._id} value={car._id}>
                      {car.make} {car.model} ({car.licensePlate})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="serviceType">Service Type *</label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
              >
                <option value="">Select service type</option>
                {center.services?.map((service, index) => (
                  <option key={index} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="scheduledDate">Preferred Date *</label>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                min={getMinDate()}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Describe any specific issues or requirements..."
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={submitting || myCars.length === 0}
              >
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceBooking;
