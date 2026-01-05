const Notification = require('../models/Notification');
const User = require('../models/User');

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const { type, isRead, page = 1, limit = 20 } = req.query;
    const filter = { recipient: req.user._id };

    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete all read notifications
const deleteReadNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({
      recipient: req.user._id,
      isRead: true
    });

    res.json({ message: 'Read notifications deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send notification to user (Admin only)
const sendNotificationToUser = async (req, res) => {
  try {
    const { userId, type, title, message, link, channels } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notification = new Notification({
      recipient: userId,
      type,
      title,
      message,
      link,
      channels: channels || { email: false, sms: false, push: true }
    });

    await notification.save();

    // In production, trigger actual notification channels here
    // await triggerNotificationChannels(notification, user);

    res.status(201).json({ message: 'Notification sent', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send notification to multiple users (Admin only)
const sendBulkNotification = async (req, res) => {
  try {
    const { userIds, role, type, title, message, link, channels } = req.body;

    let recipients = [];

    if (userIds && userIds.length > 0) {
      recipients = userIds;
    } else if (role) {
      const users = await User.find({ role, isActive: true }).select('_id');
      recipients = users.map(u => u._id);
    } else {
      const users = await User.find({ isActive: true }).select('_id');
      recipients = users.map(u => u._id);
    }

    const notifications = recipients.map(recipient => ({
      recipient,
      type,
      title,
      message,
      link,
      channels: channels || { email: false, sms: false, push: true }
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({ 
      message: 'Notifications sent', 
      count: notifications.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get notification settings
const getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notificationSettings');
    
    const settings = user.notificationSettings || {
      email: true,
      sms: false,
      push: true,
      categories: {
        booking: true,
        job: true,
        payment: true,
        message: true,
        document: true,
        system: true
      }
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const { email, sms, push, categories } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      notificationSettings: { email, sms, push, categories }
    });

    res.json({ message: 'Notification settings updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  sendNotificationToUser,
  sendBulkNotification,
  getNotificationSettings,
  updateNotificationSettings
};
