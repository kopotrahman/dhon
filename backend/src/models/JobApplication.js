const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'interview_scheduled'],
    default: 'pending'
  },
  interview: {
    scheduledAt: Date,
    location: String,
    notes: String
  },
  contract: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    documentUrl: String
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
