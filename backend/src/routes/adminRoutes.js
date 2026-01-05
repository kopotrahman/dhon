const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getPendingApprovals,
  approveEntity,
  getDashboardStats,
  getRevenueAnalytics,
  getFlaggedContent,
  getReports,
  handleReport
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Approvals
router.get('/pending-approvals', getPendingApprovals);
router.post('/approve/:type/:id', approveEntity);

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/analytics/revenue', getRevenueAnalytics);

// Content moderation
router.get('/flagged-content', getFlaggedContent);

// Reports
router.get('/reports', getReports);
router.put('/reports/:id', handleReport);

module.exports = router;
