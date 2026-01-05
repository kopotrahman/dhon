const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const notificationService = require('../utils/notificationService');

// =====================================================
// PRODUCT CATALOG
// =====================================================

// Get all products with filters
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      subCategory,
      brand,
      minPrice,
      maxPrice,
      inStock,
      featured,
      vendor,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const query = { isApproved: true, isActive: true };

    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (brand) query.brand = brand;
    if (vendor) query.vendor = vendor;
    if (featured === 'true') query.isFeatured = true;
    if (inStock === 'true') query.stock = { $gt: 0 };
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('vendor', 'businessName logo ratings')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId)
      .populate('vendor', 'businessName logo ratings contact address');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product by slug
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('vendor', 'businessName logo ratings contact');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get categories with counts
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isApproved: true, isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      isApproved: true,
      isActive: true,
      isFeatured: true
    })
      .populate('vendor', 'businessName logo')
      .limit(parseInt(limit))
      .sort('-createdAt');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query too short' });
    }

    const products = await Product.find({
      $text: { $search: q },
      isApproved: true,
      isActive: true
    })
      .populate('vendor', 'businessName')
      .limit(parseInt(limit))
      .select('name slug price images category brand');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =====================================================
// VENDOR PRODUCT MANAGEMENT
// =====================================================

// Create product (vendor)
exports.createProduct = async (req, res) => {
  try {
    // Check if user is a vendor
    const vendor = await Vendor.findOne({ user: req.user._id, isApproved: true });
    if (!vendor) {
      return res.status(403).json({ message: 'You must be an approved vendor to list products' });
    }

    const productData = {
      ...req.body,
      vendor: vendor._id,
      vendorUser: req.user._id,
      isApproved: false,
      approvalStatus: 'pending'
    };

    const product = new Product(productData);
    await product.save();

    // Update vendor product count
    vendor.totalProducts += 1;
    await vendor.save();

    res.status(201).json({
      message: 'Product created and pending approval',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product (vendor)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.vendorUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    // Certain updates require re-approval
    const requiresReapproval = ['name', 'price', 'description', 'category'];
    const needsReapproval = requiresReapproval.some(field => 
      req.body[field] && req.body[field] !== product[field]
    );

    Object.assign(product, req.body);

    if (needsReapproval && product.isApproved) {
      product.approvalStatus = 'pending';
      product.isApproved = false;
    }

    await product.save();

    res.json({
      message: needsReapproval ? 'Product updated and pending re-approval' : 'Product updated',
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product (vendor)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.vendorUser.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.productId);

    // Update vendor product count
    if (product.vendor) {
      await Vendor.findByIdAndUpdate(product.vendor, { $inc: { totalProducts: -1 } });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get vendor's products
exports.getMyProducts = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query = { vendor: vendor._id };
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.approvalStatus = 'pending';
    if (status === 'rejected') query.approvalStatus = 'rejected';

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query).sort('-createdAt').skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation = 'set' } = req.body;
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.vendorUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (operation === 'add') {
      product.stock += quantity;
    } else if (operation === 'subtract') {
      product.stock = Math.max(0, product.stock - quantity);
    } else {
      product.stock = quantity;
    }

    await product.save();

    res.json({ message: 'Stock updated', stock: product.stock });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// =====================================================
// ADMIN PRODUCT MANAGEMENT
// =====================================================

// Get pending products (admin)
exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ approvalStatus: 'pending' })
      .populate('vendor', 'businessName')
      .populate('vendorUser', 'name email')
      .sort('-createdAt');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve/reject product (admin)
exports.approveProduct = async (req, res) => {
  try {
    const { approved, rejectionReason } = req.body;
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isApproved = approved;
    product.approvalStatus = approved ? 'approved' : 'rejected';
    product.approvedBy = req.user._id;
    product.approvedAt = new Date();

    if (!approved && rejectionReason) {
      product.rejectionReason = rejectionReason;
    }

    await product.save();

    // Notify vendor
    if (product.vendorUser) {
      await notificationService.sendNotification(product.vendorUser, {
        type: approved ? 'product_approved' : 'product_rejected',
        title: approved ? 'Product Approved' : 'Product Rejected',
        message: approved 
          ? `Your product "${product.name}" has been approved and is now live.`
          : `Your product "${product.name}" was rejected. Reason: ${rejectionReason}`,
        data: { productId: product._id }
      });
    }

    res.json({
      message: `Product ${approved ? 'approved' : 'rejected'} successfully`,
      product
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Set featured status (admin)
exports.setFeatured = async (req, res) => {
  try {
    const { featured } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { isFeatured: featured },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: `Product ${featured ? 'featured' : 'unfeatured'}`, product });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all products (admin)
exports.getAllProducts = async (req, res) => {
  try {
    const { status, category, vendor, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status === 'approved') query.isApproved = true;
    if (status === 'pending') query.approvalStatus = 'pending';
    if (status === 'rejected') query.approvalStatus = 'rejected';
    if (category) query.category = category;
    if (vendor) query.vendor = vendor;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('vendor', 'businessName')
        .populate('vendorUser', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
