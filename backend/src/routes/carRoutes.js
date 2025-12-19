const express = require('express');
const router = express.Router();
const {
  createCar,
  getCars,
  getCarById,
  updateCar,
  deleteCar,
  uploadCarDocument,
  verifyCarDocument,
  approveCar
} = require('../controllers/carController');
const { authenticate, checkApproval, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Car routes
router.post('/', authenticate, checkApproval, upload.array('images', 5), createCar);
router.get('/', getCars);
router.get('/:id', getCarById);
router.put('/:id', authenticate, checkApproval, upload.array('images', 5), updateCar);
router.delete('/:id', authenticate, checkApproval, deleteCar);

// Document routes
router.post('/:carId/documents', authenticate, checkApproval, upload.single('document'), uploadCarDocument);
router.post('/:carId/documents/:documentId/verify', authenticate, authorize('admin'), verifyCarDocument);

// Admin routes
router.post('/:id/approve', authenticate, authorize('admin'), approveCar);

module.exports = router;
