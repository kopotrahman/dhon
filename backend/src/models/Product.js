const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: String,
  category: {
    type: String,
    enum: ['parts', 'tools', 'accessories', 'electronics', 'tires', 'oils', 'batteries', 'other'],
    required: true
  },
  subCategory: String,
  brand: String,
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  price: {
    type: Number,
    required: true
  },
  compareAtPrice: Number,
  costPrice: Number,
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  stock: {
    type: Number,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  trackInventory: {
    type: Boolean,
    default: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  vendorUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  specifications: [{
    key: String,
    value: String
  }],
  compatibleCars: [{
    make: String,
    model: String,
    yearFrom: Number,
    yearTo: Number
  }],
  tags: [String],
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lb', 'g'],
      default: 'kg'
    }
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'in'],
      default: 'cm'
    }
  },
  warranty: {
    duration: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years']
    },
    description: String
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  totalSold: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  this.updatedAt = new Date();
  next();
});

// Check if in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Check if low stock
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockThreshold && this.stock > 0;
});

// Discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round((1 - this.price / this.compareAtPrice) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isApproved: 1, isActive: 1 });
productSchema.index({ vendor: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
