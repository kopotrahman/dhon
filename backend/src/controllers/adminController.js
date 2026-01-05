const User = require('../models/User');
const Car = require('../models/Car');
const Job = require('../models/Job');
const Booking = require('../models/Booking');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const ForumPost = require('../models/ForumPost');
const Review = require('../models/Review');
const SupportTicket = require('../models/SupportTicket');
const { sendNotification } = require('../utils/notificationService');

// ==================== USER MANAGEMENT ====================

// Get all users
const getUsers = async (req, res) => {
  try {
    const { role, isApproved, isActive, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (isApproved !== undefined) filter.isApproved = isApproved === 'true';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
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

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken')
      .populate('kyc.verifiedBy', 'name')
      .populate('approvedBy', 'name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { role, isActive, isApproved } = req.body;
    const updateData = {};

    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isApproved !== undefined) {
      updateData.isApproved = isApproved;
      if (isApproved) {
        updateData.approvedAt = new Date();
        updateData.approvedBy = req.user._id;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Notify user of status change
    if (isApproved !== undefined) {
      await sendNotification({
        recipient: user._id,
        type: 'system',
        title: isApproved ? 'Account Approved' : 'Account Status Changed',
        message: isApproved 
          ? 'Your account has been approved. You now have full access to all features.'
          : 'Your account approval status has been updated.'
      });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    // Soft delete - deactivate instead of removing
    user.isActive = false;
    user.deactivatedAt = new Date();
    user.deactivationReason = 'Deleted by admin';
    await user.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get pending approvals
const getPendingApprovals = async (req, res) => {
  try {
    const { type } = req.query; // 'users', 'cars', 'products', 'all'

    const results = {};

    if (!type || type === 'all' || type === 'users') {
      results.users = await User.find({ 
        isApproved: false, 
        role: { $in: ['owner', 'driver'] } 
      })
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    if (!type || type === 'all' || type === 'cars') {
      results.cars = await Car.find({ isApproved: false })
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    if (!type || type === 'all' || type === 'products') {
      results.products = await Product.find({ isApproved: false })
        .populate('vendor', 'name email')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/Reject entity
const approveEntity = async (req, res) => {
  try {
    const { type, id } = req.params;
    const { approved, reason } = req.body;

    let entity;
    let notificationRecipient;
    let entityName;

    switch (type) {
      case 'user':
        entity = await User.findById(id);
        entityName = 'Account';
        notificationRecipient = entity?._id;
        if (entity) {
          entity.isApproved = approved;
          if (approved) {
            entity.approvedAt = new Date();
            entity.approvedBy = req.user._id;
          }
        }
        break;

      case 'car':
        entity = await Car.findById(id);
        entityName = 'Car listing';
        notificationRecipient = entity?.owner;
        if (entity) {
          entity.isApproved = approved;
          if (approved) {
            entity.approvedBy = req.user._id;
          }
        }
        break;

      case 'product':
        entity = await Product.findById(id);
        entityName = 'Product';
        notificationRecipient = entity?.vendor;
        if (entity) {
          entity.isApproved = approved;
          if (approved) {
            entity.approvedBy = req.user._id;
          }
        }
        break;

      default:
        return res.status(400).json({ message: 'Invalid entity type' });
    }

    if (!entity) {
      return res.status(404).json({ message: `${type} not found` });
    }

    await entity.save();

    // Send notification
    await sendNotification({
      recipient: notificationRecipient,
      type: 'system',
      title: approved ? `${entityName} Approved` : `${entityName} Rejected`,
      message: approved 
        ? `Your ${entityName.toLowerCase()} has been approved.`
        : `Your ${entityName.toLowerCase()} has been rejected. ${reason || ''}`
    });

    res.json({ message: `${type} ${approved ? 'approved' : 'rejected'} successfully`, entity });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==================== ANALYTICS DASHBOARD ====================

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Booking stats
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ 
      status: { $in: ['pending', 'confirmed', 'active'] } 
    });
    const bookingsThisWeek = await Booking.countDocuments({ 
      createdAt: { $gte: sevenDaysAgo } 
    });

    // Revenue stats
    const revenueData = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Order stats
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Car stats
    const totalCars = await Car.countDocuments({ isApproved: true });
    const availableCars = await Car.countDocuments({ 
      isApproved: true, 
      'availability.status': 'available' 
    });

    // Job stats
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });

    // Pending approvals
    const pendingUserApprovals = await User.countDocuments({ isApproved: false });
    const pendingCarApprovals = await Car.countDocuments({ isApproved: false });
    const pendingProductApprovals = await Product.countDocuments({ isApproved: false });

    // Support tickets
    const openTickets = await SupportTicket.countDocuments({ 
      status: { $in: ['open', 'in_progress'] } 
    });

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {})
      },
      bookings: {
        total: totalBookings,
        active: activeBookings,
        thisWeek: bookingsThisWeek
      },
      revenue: {
        thisMonth: revenueData[0]?.total || 0,
        transactionsThisMonth: revenueData[0]?.count || 0
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders
      },
      cars: {
        total: totalCars,
        available: availableCars
      },
      jobs: {
        total: totalJobs,
        open: openJobs
      },
      pendingApprovals: {
        users: pendingUserApprovals,
        cars: pendingCarApprovals,
        products: pendingProductApprovals,
        total: pendingUserApprovals + pendingCarApprovals + pendingProductApprovals
      },
      support: {
        openTickets
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    const today = new Date();
    
    switch (period) {
      case '7d':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Daily revenue
    const dailyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed', 
          createdAt: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue by gateway
    const revenueByGateway = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$gateway',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top customers
    const topCustomers = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          totalSpent: 1,
          transactions: 1
        }
      }
    ]);

    res.json({
      period,
      dailyRevenue,
      revenueByGateway,
      topCustomers
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==================== CONTENT MODERATION ====================

// Get flagged content
const getFlaggedContent = async (req, res) => {
  try {
    const { type } = req.query;

    const results = {};

    if (!type || type === 'reviews') {
      results.reviews = await Review.find({ isApproved: false })
        .populate('reviewer', 'name email')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    if (!type || type === 'posts') {
      results.posts = await ForumPost.find({ isModerated: true })
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .limit(50);
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==================== REPORTS ====================

// Get reports
const getReports = async (req, res) => {
  try {
    // Get support tickets that are complaints/flags
    const reports = await SupportTicket.find({ 
      category: 'complaint',
      status: { $in: ['open', 'in_progress'] }
    })
      .populate('user', 'name email')
      .sort({ priority: -1, createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Handle report
const handleReport = async (req, res) => {
  try {
    const { action, notes } = req.body;

    const report = await SupportTicket.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = action === 'resolve' ? 'resolved' : 'closed';
    report.assignedTo = req.user._id;
    report.responses.push({
      responder: req.user._id,
      message: notes || `Report ${action}d by admin`,
      createdAt: new Date()
    });
    report.updatedAt = new Date();

    await report.save();

    res.json({ message: `Report ${action}d successfully`, report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
