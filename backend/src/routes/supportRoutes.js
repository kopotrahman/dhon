const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const SupportTicket = require('../models/SupportTicket');
const FAQ = require('../models/FAQ');
const Message = require('../models/Message');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationService');

// ==================== FAQ Routes ====================

// Get all FAQs
router.get('/faq', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { question: new RegExp(search, 'i') },
        { answer: new RegExp(search, 'i') }
      ];
    }

    const faqs = await FAQ.find(filter).sort({ order: 1, createdAt: -1 });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create FAQ (Admin only)
router.post('/faq', authenticate, authorize('admin'), async (req, res) => {
  try {
    const faq = new FAQ({
      ...req.body,
      createdBy: req.user._id
    });
    await faq.save();
    res.status(201).json({ message: 'FAQ created', faq });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update FAQ (Admin only)
router.put('/faq/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.json({ message: 'FAQ updated', faq });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete FAQ (Admin only)
router.delete('/faq/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.json({ message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== Support Ticket Routes ====================

// Create support ticket
router.post('/tickets', authenticate, async (req, res) => {
  try {
    const { subject, description, category, priority } = req.body;

    const ticket = new SupportTicket({
      user: req.user._id,
      subject,
      description,
      category,
      priority: priority || 'medium'
    });

    await ticket.save();

    // Notify admins
    await sendNotification({
      recipient: null, // Will send to all admins
      type: 'system',
      title: 'New Support Ticket',
      message: `New ${priority || 'medium'} priority ticket: ${subject}`,
      link: `/admin/tickets/${ticket._id}`
    });

    res.status(201).json({ message: 'Ticket submitted successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's tickets
router.get('/tickets/my', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(filter)
      .populate('assignedTo', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(filter);

    res.json({
      tickets,
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
});

// Get ticket by ID
router.get('/tickets/:id', authenticate, async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .populate('responses.responder', 'name role');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check authorization
    if (ticket.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add response to ticket
router.post('/tickets/:id/respond', authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check authorization
    if (ticket.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    ticket.responses.push({
      responder: req.user._id,
      message,
      createdAt: new Date()
    });
    ticket.updatedAt = new Date();

    // If admin responds, update status to in_progress
    if (req.user.role === 'admin' && ticket.status === 'open') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    // Notify the other party
    const notifyUser = req.user.role === 'admin' ? ticket.user : null; // null sends to admins
    await sendNotification({
      recipient: notifyUser,
      type: 'system',
      title: 'New Response on Support Ticket',
      message: `New response on ticket: ${ticket.subject}`,
      link: `/support/tickets/${ticket._id}`
    });

    res.json({ message: 'Response added', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update ticket status (Admin only)
router.put('/tickets/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    ticket.updatedAt = new Date();

    await ticket.save();

    // Notify user
    await sendNotification({
      recipient: ticket.user,
      type: 'system',
      title: 'Ticket Status Updated',
      message: `Your ticket "${ticket.subject}" is now ${status}`,
      link: `/support/tickets/${ticket._id}`
    });

    res.json({ message: 'Ticket status updated', ticket });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all tickets (Admin only)
router.get('/tickets', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .sort({ priority: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(filter);

    // Get counts by status
    const statusCounts = await SupportTicket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      tickets,
      statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
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
});

// ==================== Chat/Message Routes ====================

// Get conversations
router.get('/messages/conversations', authenticate, async (req, res) => {
  try {
    // Get unique conversations
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id },
            { recipient: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.user._id] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$recipient', req.user._id] }, { $eq: ['$isRead', false] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Populate user info
    const populatedConversations = await User.populate(conversations, {
      path: '_id',
      select: 'name profilePhoto role'
    });

    res.json(populatedConversations.map(c => ({
      user: c._id,
      lastMessage: c.lastMessage,
      unreadCount: c.unreadCount
    })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages with a user
router.get('/messages/:userId', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'name profilePhoto')
      .populate('recipient', 'name profilePhoto');

    // Mark messages as read
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send message
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content
    });

    await message.save();
    await message.populate('sender', 'name profilePhoto');
    await message.populate('recipient', 'name profilePhoto');

    // Send notification
    await sendNotification({
      recipient: recipientId,
      type: 'message',
      title: 'New Message',
      message: `${req.user.name} sent you a message`,
      link: `/messages/${req.user._id}`
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
