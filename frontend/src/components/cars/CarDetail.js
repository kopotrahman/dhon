import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import './CarSales.css';

const CarDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [relatedCars, setRelatedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [inquiry, setInquiry] = useState({ message: '', contactPreference: 'email' });
  const [testDriveForm, setTestDriveForm] = useState({
    date: '',
    time: '',
    notes: '',
    hasValidLicense: false
  });
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchCar();
  }, [id]);

  const fetchCar = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/car-sales/${id}`);
      setCar(response.data.car);
      setRelatedCars(response.data.relatedCars || []);
    } catch (error) {
      console.error('Error fetching car:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      const response = await api.get(`/test-drives/available-slots?carId=${id}&date=${date}`);
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const handleDateChange = (date) => {
    setTestDriveForm(prev => ({ ...prev, date }));
    fetchAvailableSlots(date);
  };

  const sendInquiry = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/car-sales/${id}/inquiry`, inquiry);
      alert('Inquiry sent successfully!');
      setShowInquiryModal(false);
      setInquiry({ message: '', contactPreference: 'email' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send inquiry');
    }
  };

  const scheduleTestDrive = async (e) => {
    e.preventDefault();
    try {
      const slot = availableSlots.find(s => 
        new Date(s.start).toLocaleTimeString() === testDriveForm.time
      );
      
      await api.post('/test-drives', {
        carId: id,
        scheduledTime: {
          start: slot.start,
          end: slot.end
        },
        notes: testDriveForm.notes,
        hasValidLicense: testDriveForm.hasValidLicense,
        locationType: 'dealership'
      });
      
      alert('Test drive scheduled successfully!');
      setShowTestDriveModal(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to schedule test drive');
    }
  };

  if (loading) {
    return <div className="loading">Loading car details...</div>;
  }

  if (!car) {
    return <div className="error">Car not found</div>;
  }

  return (
    <div className="car-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back to Listings
      </button>

      <div className="car-detail-header">
        <div className="car-gallery">
          <div className="main-image">
            {car.images && car.images.length > 0 ? (
              <img src={car.images[selectedImage]?.url} alt={`${car.make} ${car.model}`} />
            ) : (
              <div className="no-image">No Image Available</div>
            )}
          </div>
          
          {car.images && car.images.length > 1 && (
            <div className="thumbnail-list">
              {car.images.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img.url} alt={`${car.make} ${car.model} ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="car-summary">
          <div className="car-badges">
            {car.condition && (
              <span className={`condition-badge ${car.condition}`}>
                {car.condition}
              </span>
            )}
            {car.isFeatured && <span className="featured-badge">Featured</span>}
          </div>

          <h1>{car.year} {car.make} {car.model}</h1>
          
          {car.listingType === 'sale' ? (
            <div className="car-price-detail">
              <span className="price">${car.price?.toLocaleString()}</span>
            </div>
          ) : (
            <div className="rental-pricing">
              {car.rentalPricing?.daily && (
                <div className="rate">
                  <span className="amount">${car.rentalPricing.daily}</span>
                  <span className="period">/day</span>
                </div>
              )}
              {car.rentalPricing?.weekly && (
                <div className="rate small">
                  ${car.rentalPricing.weekly}/week
                </div>
              )}
            </div>
          )}

          <div className="key-specs">
            <div className="spec-item">
              <span className="spec-label">Mileage</span>
              <span className="spec-value">{car.mileage?.toLocaleString()} mi</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Transmission</span>
              <span className="spec-value">{car.transmission}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Fuel Type</span>
              <span className="spec-value">{car.fuelType}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Body Type</span>
              <span className="spec-value">{car.bodyType}</span>
            </div>
          </div>

          {car.location && (
            <div className="car-location">
              📍 {car.location.city}, {car.location.state}
            </div>
          )}

          <div className="action-buttons">
            {car.listingType === 'sale' && (
              <button 
                className="test-drive-btn"
                onClick={() => setShowTestDriveModal(true)}
              >
                Schedule Test Drive
              </button>
            )}
            <button 
              className="inquiry-btn"
              onClick={() => setShowInquiryModal(true)}
            >
              Contact Seller
            </button>
          </div>

          {car.owner && (
            <div className="seller-info">
              <h4>Seller</h4>
              <p>{car.owner.name}</p>
              {car.owner.rating && (
                <p className="seller-rating">
                  {'★'.repeat(Math.round(car.owner.rating))} ({car.owner.rating})
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="car-tabs">
        <div className="tab-headers">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'features' ? 'active' : ''}
            onClick={() => setActiveTab('features')}
          >
            Features
          </button>
          <button
            className={activeTab === 'specifications' ? 'active' : ''}
            onClick={() => setActiveTab('specifications')}
          >
            Specifications
          </button>
          {car.history && (
            <button
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
            >
              Vehicle History
            </button>
          )}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <h3>Description</h3>
              <p>{car.description || 'No description provided.'}</p>

              {car.color && (
                <div className="color-info">
                  <p><strong>Exterior Color:</strong> {car.color}</p>
                  {car.interiorColor && (
                    <p><strong>Interior Color:</strong> {car.interiorColor}</p>
                  )}
                </div>
              )}

              {car.vin && (
                <p className="vin"><strong>VIN:</strong> {car.vin}</p>
              )}
            </div>
          )}

          {activeTab === 'features' && (
            <div className="features-tab">
              {car.features && car.features.length > 0 ? (
                <ul className="features-list">
                  {car.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              ) : (
                <p>No features listed.</p>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="specifications-tab">
              {car.specifications ? (
                <table className="specs-table">
                  <tbody>
                    {Object.entries(car.specifications).map(([key, value]) => (
                      <tr key={key}>
                        <td>{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No specifications available.</p>
              )}
            </div>
          )}

          {activeTab === 'history' && car.history && (
            <div className="history-tab">
              <div className="history-item">
                <span className="label">Owners:</span>
                <span className="value">{car.history.owners || 'N/A'}</span>
              </div>
              <div className="history-item">
                <span className="label">Accident History:</span>
                <span className="value">
                  {car.history.accidents ? 'Has accident history' : 'No accidents reported'}
                </span>
              </div>
              <div className="history-item">
                <span className="label">Service Records:</span>
                <span className="value">
                  {car.history.serviceRecords ? 'Available' : 'Not available'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Cars */}
      {relatedCars.length > 0 && (
        <div className="related-cars">
          <h2>Similar Cars</h2>
          <div className="related-grid">
            {relatedCars.map(relCar => (
              <a href={`/cars/${relCar._id}`} key={relCar._id} className="related-car-card">
                <div className="car-image">
                  {relCar.images && relCar.images.length > 0 ? (
                    <img src={relCar.images[0].url} alt={`${relCar.make} ${relCar.model}`} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <h4>{relCar.year} {relCar.make} {relCar.model}</h4>
                <p className="price">${relCar.price?.toLocaleString()}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      {showInquiryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Contact Seller</h2>
            <form onSubmit={sendInquiry}>
              <div className="form-group">
                <label>Your Message</label>
                <textarea
                  value={inquiry.message}
                  onChange={(e) => setInquiry(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="I'm interested in this vehicle..."
                  required
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label>Preferred Contact Method</label>
                <select
                  value={inquiry.contactPreference}
                  onChange={(e) => setInquiry(prev => ({ ...prev, contactPreference: e.target.value }))}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowInquiryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Drive Modal */}
      {showTestDriveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Schedule Test Drive</h2>
            <form onSubmit={scheduleTestDrive}>
              <div className="form-group">
                <label>Select Date</label>
                <input
                  type="date"
                  value={testDriveForm.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              {availableSlots.length > 0 && (
                <div className="form-group">
                  <label>Select Time</label>
                  <select
                    value={testDriveForm.time}
                    onChange={(e) => setTestDriveForm(prev => ({ ...prev, time: e.target.value }))}
                    required
                  >
                    <option value="">Select a time slot</option>
                    {availableSlots.map((slot, index) => (
                      <option key={index} value={new Date(slot.start).toLocaleTimeString()}>
                        {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={testDriveForm.hasValidLicense}
                    onChange={(e) => setTestDriveForm(prev => ({ ...prev, hasValidLicense: e.target.checked }))}
                  />
                  I have a valid driver's license
                </label>
              </div>

              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  value={testDriveForm.notes}
                  onChange={(e) => setTestDriveForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any special requests or questions..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowTestDriveModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary"
                  disabled={!testDriveForm.date || !testDriveForm.time || !testDriveForm.hasValidLicense}
                >
                  Schedule Test Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarDetail;
