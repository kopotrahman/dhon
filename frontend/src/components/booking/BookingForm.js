import React, { useState, useEffect } from 'react';
import { bookingAPI, carAPI } from '../../utils/api';
import './Booking.css';

const BookingForm = ({ car, selectedDate, rateType, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    startDate: selectedDate || '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    rateType: rateType || 'daily',
    pickupLocation: { address: '', city: '' },
    dropoffLocation: { address: '', city: '' },
    selfDrive: true,
    additionalServices: [],
    notes: '',
    negotiationId: null
  });
  const [calculation, setCalculation] = useState({
    duration: 0,
    rate: 0,
    subtotal: 0,
    services: 0,
    total: 0,
    deposit: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNegotiation, setShowNegotiation] = useState(false);

  const availableServices = [
    { name: 'GPS Navigation', price: 10, description: 'Per day' },
    { name: 'Child Seat', price: 15, description: 'Per booking' },
    { name: 'Additional Driver', price: 25, description: 'Per day' },
    { name: 'Insurance Premium', price: 30, description: 'Full coverage per day' }
  ];

  useEffect(() => {
    calculateTotal();
  }, [formData.startDate, formData.endDate, formData.rateType, formData.additionalServices, formData.startTime, formData.endTime]);

  const calculateTotal = () => {
    if (!formData.startDate) return;

    let duration = 0;
    let rate = 0;

    if (formData.rateType === 'hourly') {
      if (formData.startTime && formData.endTime) {
        const start = parseInt(formData.startTime.split(':')[0]);
        const end = parseInt(formData.endTime.split(':')[0]);
        duration = end - start;
        rate = car.rentRates?.hourly || 0;
      }
    } else {
      if (formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        rate = car.rentRates?.daily || 0;
      }
    }

    const subtotal = duration * rate;
    const servicesTotal = formData.additionalServices.reduce((sum, s) => sum + s.price, 0);
    const total = subtotal + servicesTotal;
    const deposit = Math.round(total * 0.2);

    setCalculation({
      duration,
      rate,
      subtotal,
      services: servicesTotal,
      total,
      deposit
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const toggleService = (service) => {
    const exists = formData.additionalServices.find(s => s.name === service.name);
    if (exists) {
      setFormData({
        ...formData,
        additionalServices: formData.additionalServices.filter(s => s.name !== service.name)
      });
    } else {
      setFormData({
        ...formData,
        additionalServices: [...formData.additionalServices, service]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let startDateTime = formData.startDate;
      let endDateTime = formData.endDate || formData.startDate;

      if (formData.rateType === 'hourly') {
        startDateTime = `${formData.startDate}T${formData.startTime}:00`;
        endDateTime = `${formData.startDate}T${formData.endTime}:00`;
      }

      const timeSlots = formData.rateType === 'hourly' ? [{
        date: formData.startDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hours: calculation.duration
      }] : undefined;

      await bookingAPI.createBooking({
        carId: car._id,
        startDate: startDateTime,
        endDate: endDateTime,
        rateType: formData.rateType,
        timeSlots,
        pickupLocation: formData.pickupLocation,
        dropoffLocation: formData.dropoffLocation,
        selfDrive: formData.selfDrive,
        additionalServices: formData.additionalServices,
        notes: formData.notes,
        negotiationId: formData.negotiationId
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form-container">
      <div className="booking-form-header">
        <h2>📋 Book {car.make} {car.model}</h2>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>

      <div className="booking-form-content">
        <div className="car-summary">
          <img 
            src={car.images?.[0]?.url || car.images?.[0] || '/placeholder-car.jpg'} 
            alt={`${car.make} ${car.model}`}
            className="car-thumbnail"
          />
          <div className="car-info">
            <h3>{car.make} {car.model} ({car.year})</h3>
            <p>{car.transmission} • {car.fuelType} • {car.specifications?.seatingCapacity} seats</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="rate-type-selector">
            <button
              type="button"
              className={`rate-btn ${formData.rateType === 'hourly' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, rateType: 'hourly' })}
            >
              ⏰ Hourly (${car.rentRates?.hourly}/hr)
            </button>
            <button
              type="button"
              className={`rate-btn ${formData.rateType === 'daily' ? 'active' : ''}`}
              onClick={() => setFormData({ ...formData, rateType: 'daily' })}
            >
              📆 Daily (${car.rentRates?.daily}/day)
            </button>
          </div>

          <div className="form-section">
            <h4>📅 Date & Time</h4>
            
            {formData.rateType === 'daily' ? (
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <select name="startTime" value={formData.startTime} onChange={handleChange}>
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>End Time *</label>
                    <select name="endTime" value={formData.endTime} onChange={handleChange}>
                      {[...Array(24)].map((_, i) => (
                        <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="form-section">
            <h4>📍 Locations</h4>
            <div className="form-group">
              <label>Pickup Location</label>
              <input
                type="text"
                name="pickupLocation.address"
                value={formData.pickupLocation.address}
                onChange={handleChange}
                placeholder="Address for pickup"
              />
            </div>
            <div className="form-group">
              <label>Dropoff Location</label>
              <input
                type="text"
                name="dropoffLocation.address"
                value={formData.dropoffLocation.address}
                onChange={handleChange}
                placeholder="Address for dropoff (leave empty if same)"
              />
            </div>
          </div>

          <div className="form-section">
            <h4>🚗 Driver Option</h4>
            <div className="driver-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="selfDrive"
                  checked={formData.selfDrive}
                  onChange={() => setFormData({ ...formData, selfDrive: true })}
                />
                <span>Self Drive</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="selfDrive"
                  checked={!formData.selfDrive}
                  onChange={() => setFormData({ ...formData, selfDrive: false })}
                />
                <span>With Driver (additional charges may apply)</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h4>➕ Additional Services</h4>
            <div className="services-grid">
              {availableServices.map((service) => (
                <label 
                  key={service.name}
                  className={`service-option ${formData.additionalServices.find(s => s.name === service.name) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={!!formData.additionalServices.find(s => s.name === service.name)}
                    onChange={() => toggleService(service)}
                  />
                  <div className="service-info">
                    <span className="service-name">{service.name}</span>
                    <span className="service-price">${service.price}</span>
                    <span className="service-desc">{service.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h4>📝 Notes</h4>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special requests or notes..."
              rows={3}
            />
          </div>

          {/* Price Calculation */}
          <div className="price-summary">
            <h4>💰 Price Summary</h4>
            <div className="price-row">
              <span>{calculation.duration} {formData.rateType === 'hourly' ? 'hours' : 'days'} × ${calculation.rate}</span>
              <span>${calculation.subtotal.toFixed(2)}</span>
            </div>
            {calculation.services > 0 && (
              <div className="price-row">
                <span>Additional Services</span>
                <span>${calculation.services.toFixed(2)}</span>
              </div>
            )}
            <div className="price-row total">
              <span>Total</span>
              <span>${calculation.total.toFixed(2)}</span>
            </div>
            <div className="price-row deposit">
              <span>Deposit Required (20%)</span>
              <span>${calculation.deposit.toFixed(2)}</span>
            </div>
          </div>

          {/* Negotiation Option */}
          <div className="negotiation-section">
            <button 
              type="button"
              className="btn btn-outline negotiate-btn"
              onClick={() => setShowNegotiation(true)}
            >
              💬 Want to negotiate the rate?
            </button>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || calculation.total === 0}
            >
              {loading ? 'Booking...' : `Book Now - $${calculation.total.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
