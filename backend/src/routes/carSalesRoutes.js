const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  listCarForSale,
  listCarForRent,
  getMyListings,
  updateCarListing,
  deleteCarListing,
  markAsSold,
  getMyInquiries,
  searchCarsForSale,
  searchCarsForRent,
  getCarById,
  sendInquiry,
  getFeaturedCars,
  getPopularMakes,
  approveCarListing,
  getPendingListings,
  toggleFeatured,
  getCarAnalytics
} = require('../controllers/carSalesController');
const upload = require('../middleware/upload');

// Public routes
router.get('/search/sale', searchCarsForSale);
router.get('/search/rent', searchCarsForRent);
router.get('/featured', getFeaturedCars);
router.get('/popular-makes', getPopularMakes);
router.get('/admin/pending', authenticate, authorize('admin'), getPendingListings);
router.get('/admin/analytics', authenticate, authorize('admin'), getCarAnalytics);

// Seller routes (authenticated)
router.post('/list/sale', authenticate, upload.array('images', 20), listCarForSale);
router.post('/list/rent', authenticate, upload.array('images', 20), listCarForRent);
router.get('/my/listings', authenticate, getMyListings);
router.get('/my/inquiries', authenticate, getMyInquiries);

// Routes with :id parameter
router.get('/:id', getCarById);
router.put('/:id', authenticate, upload.array('images', 20), updateCarListing);
router.delete('/:id', authenticate, deleteCarListing);
router.post('/:id/sold', authenticate, markAsSold);
router.post('/:id/inquiry', authenticate, sendInquiry);

// Admin routes
router.patch('/:id/approve', authenticate, authorize('admin'), approveCarListing);
router.patch('/:id/featured', authenticate, authorize('admin'), toggleFeatured);

module.exports = router;
