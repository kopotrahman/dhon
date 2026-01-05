const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productSnapshot: {
      name: String,
      sku: String,
      image: String
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending'
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discount: {
    code: String,
    amount: {
      type: Number,
      default: 0
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    apartment: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    isDefault: Boolean
  },
  billingAddress: {
    fullName: String,
    phone: String,
    street: String,
    apartment: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    sameAsShipping: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  payment: {
    method: {
      type: String,
      enum: ['card', 'paypal', 'cod', 'bank_transfer', 'wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paidAt: Date,
    paymentDetails: mongoose.Schema.Types.Mixed
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    updates: [{
      status: String,
      location: String,
      timestamp: Date,
      description: String
    }]
  },
  invoice: {
    number: String,
    url: String,
    generatedAt: Date
  },
  notes: {
    customer: String,
    internal: String
  },
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  refund: {
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected']
    },
    processedAt: Date
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

// Generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}-${random}`;
  }
  this.updatedAt = new Date();
  next();
});

// Add status to history
orderSchema.methods.updateStatus = async function(newStatus, note, userId) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note,
    updatedBy: userId
  });
  
  if (newStatus === 'delivered') {
    this.deliveredAt = new Date();
  }
  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }
  
  return this.save();
};

// Calculate order value
orderSchema.methods.calculateTotal = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.shippingCost + this.taxAmount - (this.discount?.amount || 0);
  return this.totalAmount;
};

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Indexes
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.vendor': 1 });

module.exports = mongoose.model('Order', orderSchema);
