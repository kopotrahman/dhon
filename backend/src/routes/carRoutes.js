const express = require('express');
const router = express.Router();
const {
  createCar,
  getCars,
  getCarById,
  getMyCars,
  updateCar,
  deleteCar,
  uploadCarDocument,
  updateCarDocument,
  deleteCarDocument,
  verifyCarDocument,
  getExpiringDocuments,
  getPendingDocuments,
  approveCar,
  getPendingCars,
  blockDates,
  unblockDates,
  updateAvailability
} = require('../controllers/carController');
const { authenticate, checkApproval, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Car routes
router.post('/', authenticate, checkApproval, upload.array('images', 10), createCar);
router.get('/', getCars);
router.get('/my-cars', authenticate, checkApproval, getMyCars);
router.get('/expiring-documents', authenticate, getExpiringDocuments);
router.get('/:id', getCarById);
router.put('/:id', authenticate, checkApproval, upload.array('images', 10), updateCar);
router.delete('/:id', authenticate, checkApproval, deleteCar);

// Availability management
router.put('/:carId/availability', authenticate, checkApproval, updateAvailability);
router.post('/:carId/block-dates', authenticate, checkApproval, blockDates);
router.delete('/:carId/block-dates/:blockId', authenticate, checkApproval, unblockDates);

// Document routes
router.post('/:carId/documents', authenticate, checkApproval, upload.single('document'), uploadCarDocument);
router.put('/:carId/documents/:documentId', authenticate, checkApproval, upload.single('document'), updateCarDocument);
router.delete('/:carId/documents/:documentId', authenticate, checkApproval, deleteCarDocument);

// Admin routes
router.get('/admin/pending', authenticate, authorize('admin'), getPendingCars);
router.get('/admin/pending-documents', authenticate, authorize('admin'), getPendingDocuments);
router.post('/:carId/documents/:documentId/verify', authenticate, authorize('admin'), verifyCarDocument);
router.post('/:id/approve', authenticate, authorize('admin'), approveCar);

module.exports = router;
