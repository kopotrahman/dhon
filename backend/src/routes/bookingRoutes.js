const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');
const { authenticate, checkApproval } = require('../middleware/auth');

router.post('/', authenticate, checkApproval, createBooking);
router.get('/', authenticate, getBookings);
router.get('/:id', authenticate, getBookingById);
router.put('/:id/status', authenticate, updateBookingStatus);
router.put('/:id/cancel', authenticate, cancelBooking);

module.exports = router;
