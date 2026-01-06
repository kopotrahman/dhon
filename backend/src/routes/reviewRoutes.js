const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  moderateReview,
  getPendingReviews
} = require('../controllers/reviewController');

// Public routes
router.get('/', getReviews);

// Admin routes - must come BEFORE /:id to avoid path conflicts
router.get('/admin/pending', authenticate, authorize('admin'), getPendingReviews);

router.get('/:id', getReviewById);

// Authenticated routes
router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);
router.put('/:id/moderate', authenticate, authorize('admin'), moderateReview);

module.exports = router;
