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

// Public routes
router.get('/', listVendors);
router.get('/:id', getVendorById);

// Vendor routes (authenticated)
router.post('/register', authenticate, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxDocument', maxCount: 1 }
]), registerVendor);

router.get('/me/profile', authenticate, getVendorProfile);
router.put('/me/profile', authenticate, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), updateVendorProfile);

router.post('/me/documents', authenticate, upload.array('documents', 5), uploadDocuments);
router.get('/me/dashboard', authenticate, getVendorDashboard);
router.get('/me/payouts', authenticate, getPayouts);
router.post('/me/payouts/request', authenticate, requestPayout);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), getAllVendors);
router.get('/admin/pending', authenticate, authorize('admin'), getPendingVendors);
router.patch('/admin/:id/review', authenticate, authorize('admin'), reviewVendor);
router.post('/admin/:id/payout', authenticate, authorize('admin'), processPayout);

module.exports = router;
