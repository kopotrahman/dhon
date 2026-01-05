const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  saveForLater,
  moveToCart,
  applyCoupon,
  removeCoupon,
  getCartSummary,
  validateCart
} = require('../controllers/cartController');

// All cart routes require authentication
router.use(authenticate);

// Cart operations
router.get('/', getCart);
router.get('/summary', getCartSummary);
router.post('/validate', validateCart);

// Item operations
router.post('/items', addToCart);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeFromCart);
router.delete('/clear', clearCart);

// Save for later
router.post('/items/:productId/save-for-later', saveForLater);
router.post('/items/:productId/move-to-cart', moveToCart);

// Coupon operations
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);

module.exports = router;
