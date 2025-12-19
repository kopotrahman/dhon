const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema({
  serviceCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCenter',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  notes: String,
  cost: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
