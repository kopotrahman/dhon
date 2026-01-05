const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { sendNotification } = require('../utils/notificationService');

// Register as vendor
const registerVendor = async (req, res) => {
  try {
    const existingVendor = await Vendor.findOne({ user: req.user._id });
    if (existingVendor) {
      return res.status(400).json({ message: 'You already have a vendor account' });
    }

    const {
      businessName,
      businessType,
      description,
      contactEmail,
      contactPhone,
      website,
      address,
      taxId,
      bankDetails
    } = req.body;

    const vendor = new Vendor({
      user: req.user._id,
      businessName,
      businessType,
      description,
      contactEmail: contactEmail || req.user.email,
      contactPhone: contactPhone || req.user.phone,
      website,
      address,
      taxId,
      bankDetails,
      status: 'pending'
    });

    // Handle document uploads
    if (req.files) {
      if (req.files.logo) {
        vendor.logo = `/uploads/vendors/${req.files.logo[0].filename}`;
      }
      if (req.files.businessLicense) {
        vendor.documents = vendor.documents || [];
        vendor.documents.push({
          type: 'business_license',
          url: `/uploads/vendors/${req.files.businessLicense[0].filename}`,
          uploadedAt: new Date()
        });
      }
      if (req.files.taxDocument) {
        vendor.documents = vendor.documents || [];
        vendor.documents.push({
          type: 'tax_document',
          url: `/uploads/vendors/${req.files.taxDocument[0].filename}`,
          uploadedAt: new Date()
        });
      }
    }

    await vendor.save();

    // Update user role
    await User.findByIdAndUpdate(req.user._id, { 
      role: 'vendor',
      vendorProfile: vendor._id 
    });

    // Notify admin
    await sendNotification({
      recipient: null, // Admin notification
      type: 'system',
      title: 'New Vendor Registration',
      message: `${businessName} has registered as a vendor and is pending approval.`,
      data: { vendorId: vendor._id }
    });

    res.status(201).json({ 
      message: 'Vendor registration submitted. Pending approval.',
      vendor 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get vendor profile
const getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id })
      .populate('user', 'name email phone');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update vendor profile
const updateVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const allowedUpdates = [
      'businessName', 'description', 'contactEmail', 'contactPhone',
      'website', 'address', 'bankDetails', 'socialMedia', 'policies'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        vendor[field] = req.body[field];
      }
    });

    // Handle file uploads
    if (req.files?.logo) {
      vendor.logo = `/uploads/vendors/${req.files.logo[0].filename}`;
    }
    if (req.files?.banner) {
      vendor.banner = `/uploads/vendors/${req.files.banner[0].filename}`;
    }

    await vendor.save();

    res.json({ message: 'Profile updated', vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload vendor documents
const uploadDocuments = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { documentType } = req.body;

    const newDocuments = req.files.map(file => ({
      type: documentType || 'other',
      url: `/uploads/vendors/${file.filename}`,
      uploadedAt: new Date(),
      status: 'pending'
    }));

    vendor.documents.push(...newDocuments);
    await vendor.save();

    res.json({ message: 'Documents uploaded', documents: vendor.documents });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get vendor dashboard stats
const getVendorDashboard = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Get product stats
    const productStats = await Product.aggregate([
      { $match: { vendor: vendor._id } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { 
            $sum: { $cond: ['$isActive', 1, 0] } 
          },
          lowStock: { 
            $sum: { $cond: [{ $lte: ['$stock', '$lowStockThreshold'] }, 1, 0] } 
          },
          outOfStock: { 
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } 
          }
        }
      }
    ]);

    // Get order stats for this vendor
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orderStats = await Order.aggregate([
      { $match: { 'items.vendor': vendor._id } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendor._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$items.totalPrice' },
          pendingOrders: { 
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } 
          }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find({ 'items.vendor': vendor._id })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Revenue over time
    const revenueByDate = await Order.aggregate([
      { 
        $match: { 
          'items.vendor': vendor._id,
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendor._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$items.totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      vendor: {
        status: vendor.status,
        rating: vendor.rating,
        totalReviews: vendor.totalReviews
      },
      products: productStats[0] || {
        totalProducts: 0,
        activeProducts: 0,
        lowStock: 0,
        outOfStock: 0
      },
      orders: orderStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0
      },
      recentOrders,
      revenueByDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get vendor payouts
const getPayouts = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Calculate pending earnings
    const pendingEarnings = await Order.aggregate([
      { 
        $match: { 
          'items.vendor': vendor._id,
          status: 'delivered',
          'payment.status': 'completed'
        } 
      },
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendor._id } },
      {
        $group: {
          _id: null,
          total: { $sum: '$items.totalPrice' }
        }
      }
    ]);

    res.json({
      pendingEarnings: pendingEarnings[0]?.total || 0,
      totalEarnings: vendor.totalSales || 0,
      payouts: vendor.payouts || [],
      bankDetails: vendor.bankDetails ? {
        accountName: vendor.bankDetails.accountName,
        bankName: vendor.bankDetails.bankName,
        lastFour: vendor.bankDetails.accountNumber?.slice(-4)
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Request payout
const requestPayout = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    if (vendor.status !== 'approved') {
      return res.status(400).json({ message: 'Vendor account not approved' });
    }

    if (!vendor.bankDetails?.accountNumber) {
      return res.status(400).json({ message: 'Please add bank details first' });
    }

    // Calculate available balance
    const { amount } = req.body;
    const minPayout = 50; // Minimum payout amount

    if (amount < minPayout) {
      return res.status(400).json({ 
        message: `Minimum payout amount is $${minPayout}` 
      });
    }

    const payout = {
      amount,
      status: 'pending',
      requestedAt: new Date(),
      method: vendor.bankDetails.bankName ? 'bank_transfer' : 'other'
    };

    vendor.payouts = vendor.payouts || [];
    vendor.payouts.push(payout);
    await vendor.save();

    // Notify admin
    await sendNotification({
      recipient: null,
      type: 'payment',
      title: 'Payout Request',
      message: `${vendor.businessName} requested a payout of $${amount}`,
      data: { vendorId: vendor._id, amount }
    });

    res.json({ message: 'Payout request submitted', payout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get public vendor profile
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .select('-documents -bankDetails -payouts -taxId');

    if (!vendor || vendor.status !== 'approved') {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Get vendor products
    const products = await Product.find({ 
      vendor: vendor._id, 
      isActive: true,
      status: 'approved'
    })
    .sort({ createdAt: -1 })
    .limit(12);

    res.json({ vendor, products });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// List all vendors (public)
const listVendors = async (req, res) => {
  try {
    const { 
      businessType, 
      search, 
      sortBy = 'rating',
      page = 1, 
      limit = 20 
    } = req.query;

    const query = { status: 'approved' };

    if (businessType) {
      query.businessType = businessType;
    }

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {
      rating: { rating: -1 },
      newest: { createdAt: -1 },
      name: { businessName: 1 }
    };

    const vendors = await Vendor.find(query)
      .select('businessName businessType logo description rating totalReviews')
      .sort(sortOptions[sortBy] || sortOptions.rating)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(query);

    res.json({
      vendors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// === ADMIN FUNCTIONS ===

// Get pending vendor applications
const getPendingVendors = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const vendors = await Vendor.find({ status: 'pending' })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments({ status: 'pending' });

    res.json({
      vendors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/reject vendor
const reviewVendor = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    vendor.status = status;
    vendor.statusHistory = vendor.statusHistory || [];
    vendor.statusHistory.push({
      status,
      notes,
      changedBy: req.user._id,
      changedAt: new Date()
    });

    if (status === 'approved') {
      vendor.approvedAt = new Date();
      vendor.approvedBy = req.user._id;
    }

    await vendor.save();

    // Update user verification status
    if (status === 'approved') {
      await User.findByIdAndUpdate(vendor.user, { 
        isVendorApproved: true 
      });
    }

    // Notify vendor
    await sendNotification({
      recipient: vendor.user,
      type: 'system',
      title: `Vendor Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: status === 'approved' 
        ? 'Congratulations! Your vendor application has been approved. You can now start selling.'
        : `Your vendor application has been ${status}. ${notes || ''}`,
      data: { vendorId: vendor._id }
    });

    res.json({ message: `Vendor ${status}`, vendor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all vendors (admin)
const getAllVendors = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const vendors = await Vendor.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(query);

    // Stats by status
    const stats = await Vendor.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      vendors,
      stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Process vendor payout (admin)
const processPayout = async (req, res) => {
  try {
    const { payoutId, status, transactionId, notes } = req.body;

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const payout = vendor.payouts.id(payoutId);
    if (!payout) {
      return res.status(404).json({ message: 'Payout not found' });
    }

    payout.status = status;
    payout.processedAt = new Date();
    payout.processedBy = req.user._id;
    payout.transactionId = transactionId;
    payout.notes = notes;

    await vendor.save();

    // Notify vendor
    await sendNotification({
      recipient: vendor.user,
      type: 'payment',
      title: `Payout ${status}`,
      message: status === 'completed'
        ? `Your payout of $${payout.amount} has been processed.`
        : `Your payout request has been ${status}. ${notes || ''}`,
      data: { vendorId: vendor._id, payoutId }
    });

    res.json({ message: `Payout ${status}`, payout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  // Vendor functions
  registerVendor,
  getVendorProfile,
  updateVendorProfile,
  uploadDocuments,
  getVendorDashboard,
  getPayouts,
  requestPayout,
  
  // Public functions
  getVendorById,
  listVendors,
  
  // Admin functions
  getPendingVendors,
  reviewVendor,
  getAllVendors,
  processPayout
};
