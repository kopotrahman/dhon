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
  expectedSalary: {
    amount: Number,
    period: String
  },
  availability: {
    startDate: Date,
    isImmediate: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'interview_scheduled', 'interview_completed', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  // Interview details
  interview: {
    scheduledAt: Date,
    duration: Number, // in minutes
    location: {
      type: {
        type: String,
        enum: ['in_person', 'video_call', 'phone_call'],
        default: 'in_person'
      },
      address: String,
      meetingLink: String,
      phone: String
    },
    notes: String,
    reminderSent: {
      type: Boolean,
      default: false
    },
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      conductedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      conductedAt: Date
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled'
    }
  },
  // Contract/E-sign system
  contract: {
    templateId: String,
    documentUrl: String,
    terms: {
      salary: Number,
      salaryPeriod: String,
      startDate: Date,
      endDate: Date,
      workingHours: String,
      benefits: [String],
      responsibilities: [String],
      terminationClause: String
    },
    signatures: {
      owner: {
        signed: { type: Boolean, default: false },
        signedAt: Date,
        signatureUrl: String,
        ipAddress: String
      },
      driver: {
        signed: { type: Boolean, default: false },
        signedAt: Date,
        signatureUrl: String,
        ipAddress: String
      }
    },
    status: {
      type: String,
      enum: ['not_created', 'pending_driver', 'pending_owner', 'signed', 'rejected', 'expired'],
      default: 'not_created'
    },
    sentAt: Date,
    expiresAt: Date,
    signedDocumentUrl: String
  },
  // Communication history
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Rating after job completion
  rating: {
    byOwner: {
      rating: Number,
      feedback: String,
      createdAt: Date
    },
    byDriver: {
      rating: Number,
      feedback: String,
      createdAt: Date
    }
  },
  rejectionReason: String,
  appliedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update timestamp
jobApplicationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
