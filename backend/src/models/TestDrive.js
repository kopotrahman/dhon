const mongoose = require('mongoose');

const testDriveSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    start: {
      type: String,
      required: true
    },
    end: String
  },
  duration: {
    type: Number,
    default: 30 // minutes
  },
  locationType: {
    type: String,
    enum: ['dealership', 'customer_location', 'neutral_location'],
    default: 'dealership'
  },
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  customerInfo: {
    drivingLicense: String,
    licenseVerified: {
      type: Boolean,
      default: false
    },
    phone: String,
    preferredContact: {
      type: String,
      enum: ['phone', 'email', 'whatsapp'],
      default: 'phone'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  rescheduleInfo: {
    originalDate: Date,
    originalTime: String,
    reason: String,
    requestedBy: {
      type: String,
      enum: ['customer', 'owner']
    }
  },
  notes: String,
  requirements: String,
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    interestedInBuying: Boolean,
    priceExpectation: Number,
    followUpRequested: Boolean,
    submittedAt: Date
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push']
    },
    sentAt: Date,
    status: String
  }],
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
testDriveSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Update status with history
testDriveSchema.methods.updateStatus = async function(newStatus, note) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    note
  });
  return this.save();
};

// Indexes
testDriveSchema.index({ car: 1, scheduledDate: 1 });
testDriveSchema.index({ customer: 1 });
testDriveSchema.index({ owner: 1 });
testDriveSchema.index({ status: 1 });

module.exports = mongoose.model('TestDrive', testDriveSchema);
