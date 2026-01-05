const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  sendNotificationToUser,
  sendBulkNotification,
  getNotificationSettings,
  updateNotificationSettings
} = require('../controllers/notificationController');

// User routes
router.get('/', authenticate, getNotifications);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteNotification);
router.delete('/read/all', authenticate, deleteReadNotifications);

// Settings
router.get('/settings', authenticate, getNotificationSettings);
router.put('/settings', authenticate, updateNotificationSettings);

// Admin routes
router.post('/send', authenticate, authorize('admin'), sendNotificationToUser);
router.post('/send-bulk', authenticate, authorize('admin'), sendBulkNotification);

module.exports = router;
