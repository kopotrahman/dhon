const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Time slots for hourly bookings
  timeSlots: [{
    date: Date,
    startTime: String, // "09:00"
    endTime: String,   // "17:00"
    hours: Number
  }],
  rateType: {
    type: String,
    enum: ['hourly', 'daily'],
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  totalHours: Number,
  totalDays: Number,
  totalAmount: {
    type: Number,
    required: true
  },
  // Negotiation reference
  negotiation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RateNegotiation'
  },
  isNegotiated: {
    type: Boolean,
    default: false
  },
  originalAmount: Number,
  deposit: {
    amount: Number,
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    refunded: {
      type: Boolean,
      default: false
    },
    refundedAt: Date
  },
  insurance: {
    required: {
      type: Boolean,
      default: false
    },
    verified: {
      type: Boolean,
      default: false
    },
    documentUrl: String
  },
  pickupLocation: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  dropoffLocation: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  driver: {
    selfDrive: {
      type: Boolean,
      default: true
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  additionalServices: [{
    name: String,
    price: Number,
    description: String
  }],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    cancelledAt: Date,
    refundAmount: Number
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  notes: String,
  ownerNotes: String,
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
bookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check for booking conflicts
bookingSchema.statics.checkConflict = async function(carId, startDate, endDate, excludeBookingId = null) {
  const query = {
    car: carId,
    status: { $in: ['pending', 'confirmed', 'active'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const conflictingBooking = await this.findOne(query);
  return conflictingBooking;
};

// Get all bookings for a car within a date range (for calendar display)
bookingSchema.statics.getCarBookings = async function(carId, startDate, endDate) {
  return await this.find({
    car: carId,
    status: { $in: ['pending', 'confirmed', 'active'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  })
  .select('startDate endDate timeSlots rateType status customer')
  .populate('customer', 'name email')
  .sort({ startDate: 1 });
};

// Calculate availability slots
bookingSchema.statics.getAvailableSlots = async function(carId, date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await this.find({
    car: carId,
    status: { $in: ['pending', 'confirmed', 'active'] },
    startDate: { $lte: dayEnd },
    endDate: { $gte: dayStart }
  }).select('timeSlots startDate endDate rateType');

  // All possible hours in a day
  const allSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    allSlots.push({
      hour,
      time: `${hour.toString().padStart(2, '0')}:00`,
      available: true
    });
  }

  // Mark unavailable slots
  bookings.forEach(booking => {
    if (booking.rateType === 'daily') {
      // Entire day is booked
      allSlots.forEach(slot => slot.available = false);
    } else if (booking.timeSlots) {
      booking.timeSlots.forEach(ts => {
        const slotDate = new Date(ts.date);
        if (slotDate.toDateString() === dayStart.toDateString()) {
          const startHour = parseInt(ts.startTime.split(':')[0]);
          const endHour = parseInt(ts.endTime.split(':')[0]);
          for (let h = startHour; h < endHour; h++) {
            const slot = allSlots.find(s => s.hour === h);
            if (slot) slot.available = false;
          }
        }
      });
    }
  });

  return allSlots;
};

module.exports = mongoose.model('Booking', bookingSchema);
