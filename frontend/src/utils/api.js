import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== JOB API ====================
export const jobAPI = {
  // Jobs
  createJob: (data) => api.post('/jobs', data),
  getJobs: (params) => api.get('/jobs', { params }),
  getMyJobs: (params) => api.get('/jobs/my-jobs', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),

  // Applications
  applyForJob: (data) => api.post('/jobs/apply', data),
  getMyApplications: () => api.get('/jobs/applications/my'),
  getApplicationById: (id) => api.get(`/jobs/applications/${id}`),
  updateApplicationStatus: (id, data) => api.put(`/jobs/applications/${id}/status`, data),
  withdrawApplication: (id) => api.post(`/jobs/applications/${id}/withdraw`),

  // Interviews
  scheduleInterview: (applicationId, data) => api.post(`/jobs/applications/${applicationId}/interview`, data),
  updateInterviewStatus: (applicationId, data) => api.put(`/jobs/applications/${applicationId}/interview/status`, data),

  // Contracts
  createContract: (applicationId, data) => api.post(`/jobs/applications/${applicationId}/contract`, data),
  signContract: (applicationId, data) => api.post(`/jobs/applications/${applicationId}/contract/sign`, data),

  // Messaging
  sendMessage: (applicationId, content) => api.post(`/jobs/applications/${applicationId}/messages`, { content }),
};

// ==================== BOOKING API ====================
export const bookingAPI = {
  // Bookings
  createBooking: (data) => api.post('/bookings', data),
  getBookings: (params) => api.get('/bookings', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  updateBookingStatus: (id, data) => api.put(`/bookings/${id}/status`, data),
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),

  // Calendar
  getCarCalendar: (carId, month, year) => api.get(`/bookings/car/${carId}/calendar`, { params: { month, year } }),
  getAvailableSlots: (carId, date) => api.get(`/bookings/car/${carId}/slots`, { params: { date } }),

  // Negotiations
  startNegotiation: (data) => api.post('/bookings/negotiations', data),
  getMyNegotiations: (status) => api.get('/bookings/negotiations/my', { params: { status } }),
  respondToNegotiation: (id, data) => api.put(`/bookings/negotiations/${id}/respond`, data),
  respondToCounterOffer: (id, data) => api.put(`/bookings/negotiations/${id}/counter-response`, data),
  sendNegotiationMessage: (id, content) => api.post(`/bookings/negotiations/${id}/messages`, { content }),
};

// ==================== CAR API ====================
export const carAPI = {
  // Cars
  createCar: (data) => api.post('/cars', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getCars: (params) => api.get('/cars', { params }),
  getMyCars: (params) => api.get('/cars/my-cars', { params }),
  getCarById: (id) => api.get(`/cars/${id}`),
  updateCar: (id, data) => api.put(`/cars/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCar: (id) => api.delete(`/cars/${id}`),

  // Availability
  updateAvailability: (carId, data) => api.put(`/cars/${carId}/availability`, data),
  blockDates: (carId, data) => api.post(`/cars/${carId}/block-dates`, data),
  unblockDates: (carId, blockId) => api.delete(`/cars/${carId}/block-dates/${blockId}`),

  // Documents
  uploadDocument: (carId, data) => api.post(`/cars/${carId}/documents`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateDocument: (carId, documentId, data) => api.put(`/cars/${carId}/documents/${documentId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteDocument: (carId, documentId) => api.delete(`/cars/${carId}/documents/${documentId}`),
  getExpiringDocuments: (daysAhead) => api.get('/cars/expiring-documents', { params: { daysAhead } }),

  // Admin
  getPendingCars: () => api.get('/cars/admin/pending'),
  getPendingDocuments: () => api.get('/cars/admin/pending-documents'),
  verifyDocument: (carId, documentId, data) => api.post(`/cars/${carId}/documents/${documentId}/verify`, data),
  approveCar: (id, data) => api.post(`/cars/${id}/approve`, data),
};

export default api;
