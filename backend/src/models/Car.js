const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  color: String,
  licensePlate: {
    type: String,
    required: true,
    unique: true
  },
  vin: {
    type: String,
    unique: true,
    sparse: true
  },
  mileage: {
    type: Number,
    default: 0
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'lpg'],
    required: true
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic'],
    required: true
  },
  category: {
    type: String,
    enum: ['sedan', 'suv', 'hatchback', 'luxury', 'commercial', 'van', 'truck', 'other'],
    default: 'sedan'
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  specifications: {
    seatingCapacity: Number,
    engineCapacity: String,
    horsePower: Number,
    fuelEfficiency: String,
    features: [String],
    airConditioning: Boolean,
    gps: Boolean,
    bluetooth: Boolean,
    usbCharging: Boolean,
    childSeat: Boolean,
    sunroof: Boolean
  },
  // Enhanced documents section
  documents: [{
    type: {
      type: String,
      enum: ['rc', 'insurance', 'pollution', 'permit', 'fitness', 'tax', 'other'],
      required: true
    },
    name: String,
    documentNumber: String,
    documentUrl: String,
    issueDate: Date,
    expiryDate: Date,
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending'
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectionReason: String,
    remindersSent: [{
      sentAt: Date,
      daysBeforeExpiry: Number
    }],
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  // For sale/rent
  forSale: {
    type: Boolean,
    default: false
  },
  salePrice: Number,
  negotiable: {
    type: Boolean,
    default: false
  },
  forRent: {
    type: Boolean,
    default: false
  },
  rentRates: {
    hourly: Number,
    daily: Number,
    weekly: Number,
    monthly: Number,
    minimumHours: {
      type: Number,
      default: 1
    },
    minimumDays: {
      type: Number,
      default: 1
    }
  },
  // Security deposit
  securityDeposit: {
    amount: Number,
    refundable: {
      type: Boolean,
      default: true
    }
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance', 'sold', 'unavailable'],
      default: 'available'
    },
    nextAvailableDate: Date,
    unavailableReason: String
  },
  // Blocked dates (for owner's personal use)
  blockedDates: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Approval status
  isApproved: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  // Stats
  stats: {
    totalBookings: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
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

// Pre-save middleware
carSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to check document expiry
carSchema.methods.getExpiringDocuments = function(daysAhead = 30) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  
  return this.documents.filter(doc => {
    if (!doc.expiryDate) return false;
    const expiryDate = new Date(doc.expiryDate);
    return expiryDate <= targetDate && expiryDate >= new Date();
  });
};

// Method to check expired documents
carSchema.methods.getExpiredDocuments = function() {
  const today = new Date();
  return this.documents.filter(doc => {
    if (!doc.expiryDate) return false;
    return new Date(doc.expiryDate) < today;
  });
};

// Static method to find cars with expiring documents
carSchema.statics.findCarsWithExpiringDocuments = async function(daysAhead = 30) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  const today = new Date();
  
  return await this.find({
    'documents.expiryDate': { 
      $gte: today,
      $lte: targetDate 
    }
  }).populate('owner', 'name email');
};

// Static method to find cars with expired documents
carSchema.statics.findCarsWithExpiredDocuments = async function() {
  const today = new Date();
  
  return await this.find({
    'documents.expiryDate': { $lt: today },
    'documents.verificationStatus': { $ne: 'expired' }
  }).populate('owner', 'name email');
};

// Index for efficient queries
carSchema.index({ owner: 1 });
carSchema.index({ 'availability.status': 1 });
carSchema.index({ 'documents.expiryDate': 1 });
carSchema.index({ isApproved: 1, forRent: 1 });

module.exports = mongoose.model('Car', carSchema);
