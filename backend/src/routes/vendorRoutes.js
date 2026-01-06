const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  uploadDocuments,
  getVendorDashboard,
  getPayouts,
  requestPayout,
  getVendorById,
  listVendors,
  getPendingVendors,
  reviewVendor,
  getAllVendors,
  processPayout
} = require('../controllers/vendorController');
const upload = require('../middleware/upload');

// Public routes - must come before /:id to avoid conflicts
router.get('/admin/all', authenticate, authorize('admin'), getAllVendors);
router.get('/admin/pending', authenticate, authorize('admin'), getPendingVendors);
router.get('/', listVendors);

// Vendor routes (authenticated) - must come before /:id
router.post('/register', authenticate, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxDocument', maxCount: 1 }
]), registerVendor);

router.get('/me/profile', authenticate, getVendorProfile);
router.get('/me/dashboard', authenticate, getVendorDashboard);
router.get('/me/payouts', authenticate, getPayouts);

// Routes with :id parameter
router.get('/:id', getVendorById);

router.put('/me/profile', authenticate, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), updateVendorProfile);

router.post('/me/documents', authenticate, upload.array('documents', 5), uploadDocuments);
router.post('/me/payouts/request', authenticate, requestPayout);

// Admin routes
router.patch('/:id/review', authenticate, authorize('admin'), reviewVendor);
router.post('/:id/payout', authenticate, authorize('admin'), processPayout);

module.exports = router;
