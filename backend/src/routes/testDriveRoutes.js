const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  scheduleTestDrive,
  getMyTestDrives,
  getTestDriveById,
  confirmTestDrive,
  rescheduleTestDrive,
  cancelTestDrive,
  completeTestDrive,
  submitFeedback,
  getAvailableSlots,
  getOwnerTestDrives,
  getAllTestDrives
} = require('../controllers/testDriveController');

// Public routes
router.get('/available-slots', getAvailableSlots);
router.get('/admin/all', authenticate, authorize('admin'), getAllTestDrives);
router.get('/owner/requests', authenticate, getOwnerTestDrives);

// Customer routes (authenticated)
router.post('/', authenticate, scheduleTestDrive);
router.get('/my-test-drives', authenticate, getMyTestDrives);
router.get('/:id', authenticate, getTestDriveById);
router.post('/:id/reschedule', authenticate, rescheduleTestDrive);
router.post('/:id/cancel', authenticate, cancelTestDrive);
router.post('/:id/feedback', authenticate, submitFeedback);
router.post('/:id/confirm', authenticate, confirmTestDrive);
router.post('/:id/complete', authenticate, completeTestDrive);

module.exports = router;
