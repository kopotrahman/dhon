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
  mileage: {
    type: Number,
    default: 0
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
    required: true
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic'],
    required: true
  },
  images: [String],
  specifications: {
    seatingCapacity: Number,
    engineCapacity: String,
    features: [String]
  },
  documents: [{
    type: {
      type: String,
      enum: ['rc', 'insurance', 'pollution', 'permit']
    },
    documentNumber: String,
    documentUrl: String,
    issueDate: Date,
    expiryDate: Date,
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // For sale/rent
  forSale: {
    type: Boolean,
    default: false
  },
  salePrice: Number,
  forRent: {
    type: Boolean,
    default: false
  },
  rentRates: {
    hourly: Number,
    daily: Number
  },
  availability: {
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance', 'sold'],
      default: 'available'
    }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Car', carSchema);
