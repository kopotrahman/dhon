const express = require('express');
const router = express.Router();
const { uploadKYCDocuments, verifyKYC, approveUser, getPendingApprovals } = require('../controllers/kycController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// User routes
router.post('/upload', authenticate, upload.single('document'), uploadKYCDocuments);

// Admin routes
router.post('/verify/:userId', authenticate, authorize('admin'), verifyKYC);
router.post('/approve/:userId', authenticate, authorize('admin'), approveUser);
router.get('/pending', authenticate, authorize('admin'), getPendingApprovals);

module.exports = router;
