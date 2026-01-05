const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderInvoice
} = require('../controllers/orderController');

// All order routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);
router.get('/:id/invoice', getOrderInvoice);

// Admin routes
router.patch('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
