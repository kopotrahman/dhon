const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  salary: {
    amount: {
      type: Number,
      required: true
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly'],
      required: true
    },
    negotiable: {
      type: Boolean,
      default: false
    }
  },
  carModel: {
    type: String,
    required: true
  },
  carType: {
    type: String,
    enum: ['sedan', 'suv', 'hatchback', 'luxury', 'commercial', 'other']
  },
  requirements: [String],
  benefits: [String],
  workingHours: {
    start: String,
    end: String,
    daysPerWeek: Number
  },
  experienceRequired: {
    years: Number,
    description: String
  },
  licenseRequired: {
    type: String,
    enum: ['light', 'heavy', 'commercial', 'any'],
    default: 'any'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  isUrgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'closed', 'filled', 'cancelled'],
    default: 'open'
  },
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication'
  }],
  hiredDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
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

// Index for search
jobSchema.index({ title: 'text', description: 'text', 'location.city': 'text' });

module.exports = mongoose.model('Job', jobSchema);

module.exports = mongoose.model('Job', jobSchema);
