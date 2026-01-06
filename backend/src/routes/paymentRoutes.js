const express = require('express');
const router = express.Router();
const {
  initializePayment,
  handlePaymentCallback,
  getPaymentHistory,
  getPaymentById,
  requestRefund,
  processRefund
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Webhook for payment callbacks (public route - no auth required)
router.post('/callback', handlePaymentCallback);
router.post('/webhook/:gateway', handlePaymentCallback);

// All other payment routes require authentication
router.use(authenticate);

// Initialize payment
router.post('/initialize', initializePayment);

// Get payment history
router.get('/history', getPaymentHistory);

// Get payment by ID
router.get('/:id', getPaymentById);

// Request refund
router.post('/:id/refund', requestRefund);

// Process refund (admin)
router.post('/:id/process-refund', processRefund);

module.exports = router;
