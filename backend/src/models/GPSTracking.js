const mongoose = require('mongoose');

const gpsTrackingSchema = new mongoose.Schema({
  car: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  deviceId: {
    type: String,
    required: true
  },
  currentLocation: {
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    address: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  speed: {
    type: Number,
    default: 0
  },
  heading: {
    type: Number,
    default: 0
  },
  ignitionStatus: {
    type: String,
    enum: ['on', 'off', 'unknown'],
    default: 'unknown'
  },
  fuelLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  odometer: {
    type: Number,
    default: 0
  },
  locationHistory: [{
    coordinates: {
      lat: Number,
      lng: Number
    },
    address: String,
    speed: Number,
    timestamp: Date
  }],
  geofences: [{
    name: String,
    type: {
      type: String,
      enum: ['circle', 'polygon']
    },
    center: {
      lat: Number,
      lng: Number
    },
    radius: Number, // For circle type
    polygon: [{ lat: Number, lng: Number }], // For polygon type
    alertOnEntry: Boolean,
    alertOnExit: Boolean
  }],
  alerts: [{
    type: {
      type: String,
      enum: ['speeding', 'geofence_entry', 'geofence_exit', 'harsh_braking', 'harsh_acceleration', 'idle_time']
    },
    message: String,
    location: {
      lat: Number,
      lng: Number
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add geospatial index
gpsTrackingSchema.index({ 'currentLocation.coordinates': '2dsphere' });

module.exports = mongoose.model('GPSTracking', gpsTrackingSchema);
