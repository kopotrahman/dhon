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

// ==================== REVIEW API ====================
export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getReviews: (params) => api.get('/reviews', { params }),
  getReviewById: (id) => api.get(`/reviews/${id}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  getPendingReviews: () => api.get('/reviews/admin/pending'),
  moderateReview: (id, data) => api.put(`/reviews/${id}/moderate`, data),
};

// ==================== SERVICE CENTER API ====================
export const serviceCenterAPI = {
  getCenters: (params) => api.get('/service-centers', { params }),
  getCenterById: (id) => api.get(`/service-centers/${id}`),
  createCenter: (data) => api.post('/service-centers', data),
  updateCenter: (id, data) => api.put(`/service-centers/${id}`, data),
  deleteCenter: (id) => api.delete(`/service-centers/${id}`),
  bookService: (centerId, data) => api.post(`/service-centers/${centerId}/book`, data),
  getMyServiceBookings: (params) => api.get('/service-centers/bookings/my', { params }),
  updateServiceBookingStatus: (bookingId, data) => api.put(`/service-centers/bookings/${bookingId}/status`, data),
  getGPSTracking: (carId) => api.get(`/service-centers/gps/${carId}`),
  updateGPSLocation: (carId, data) => api.put(`/service-centers/gps/${carId}/location`, data),
  getGPSHistory: (carId) => api.get(`/service-centers/gps/${carId}/history`),
};

// ==================== FORUM API ====================
export const forumAPI = {
  getPosts: (params) => api.get('/forum', { params }),
  getPostById: (id) => api.get(`/forum/${id}`),
  createPost: (data) => api.post('/forum', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePost: (id, data) => api.put(`/forum/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deletePost: (id) => api.delete(`/forum/${id}`),
  toggleLike: (id) => api.post(`/forum/${id}/like`),
  addComment: (id, content) => api.post(`/forum/${id}/comments`, { content }),
  deleteComment: (postId, commentId) => api.delete(`/forum/${postId}/comments/${commentId}`),
  getPopularTags: () => api.get('/forum/tags/popular'),
  moderatePost: (id, data) => api.put(`/forum/${id}/moderate`, data),
};

// ==================== NOTIFICATION API ====================
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteReadNotifications: () => api.delete('/notifications/read/all'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (data) => api.put('/notifications/settings', data),
  sendNotification: (data) => api.post('/notifications/send', data),
  sendBulkNotification: (data) => api.post('/notifications/send-bulk', data),
};

// ==================== SUPPORT API ====================
export const supportAPI = {
  // FAQ
  getFAQs: (params) => api.get('/support/faq', { params }),
  createFAQ: (data) => api.post('/support/faq', data),
  updateFAQ: (id, data) => api.put(`/support/faq/${id}`, data),
  deleteFAQ: (id) => api.delete(`/support/faq/${id}`),
  
  // Tickets
  createTicket: (data) => api.post('/support/tickets', data),
  getMyTickets: (params) => api.get('/support/tickets/my', { params }),
  getTicketById: (id) => api.get(`/support/tickets/${id}`),
  respondToTicket: (id, message) => api.post(`/support/tickets/${id}/respond`, { message }),
  updateTicketStatus: (id, data) => api.put(`/support/tickets/${id}/status`, data),
  getAllTickets: (params) => api.get('/support/tickets', { params }),
  
  // Messages
  getConversations: () => api.get('/support/messages/conversations'),
  getMessages: (userId, params) => api.get(`/support/messages/${userId}`, { params }),
  sendMessage: (data) => api.post('/support/messages', data),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }),
  
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Approvals
  getPendingApprovals: (type) => api.get('/admin/pending-approvals', { params: { type } }),
  approveEntity: (type, id, data) => api.post(`/admin/approve/${type}/${id}`, data),
  
  // Content Moderation
  getFlaggedContent: (type) => api.get('/admin/flagged-content', { params: { type } }),
  
  // Reports
  getReports: () => api.get('/admin/reports'),
  handleReport: (id, data) => api.put(`/admin/reports/${id}`, data),
};

export default api;
