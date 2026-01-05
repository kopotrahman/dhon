const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  getCarCalendar,
  getAvailableSlots,
  updateBookingStatus,
  cancelBooking,
  startNegotiation,
  respondToNegotiation,
  respondToCounterOffer,
  getMyNegotiations,
  sendNegotiationMessage
} = require('../controllers/bookingController');
const { authenticate, checkApproval, authorize } = require('../middleware/auth');

// Booking routes
router.post('/', authenticate, checkApproval, createBooking);
router.get('/', authenticate, getBookings);
router.get('/:id', authenticate, getBookingById);
router.put('/:id/status', authenticate, checkApproval, updateBookingStatus);
router.put('/:id/cancel', authenticate, cancelBooking);

// Calendar and availability routes
router.get('/car/:carId/calendar', getCarCalendar);
router.get('/car/:carId/slots', getAvailableSlots);

// Rate negotiation routes
router.post('/negotiations', authenticate, checkApproval, startNegotiation);
router.get('/negotiations/my', authenticate, getMyNegotiations);
router.put('/negotiations/:negotiationId/respond', authenticate, checkApproval, authorize('owner'), respondToNegotiation);
router.put('/negotiations/:negotiationId/counter-response', authenticate, checkApproval, respondToCounterOffer);
router.post('/negotiations/:negotiationId/messages', authenticate, checkApproval, sendNegotiationMessage);

module.exports = router;
