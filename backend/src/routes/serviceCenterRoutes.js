const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ServiceCenter = require('../models/ServiceCenter');
const ServiceBooking = require('../models/ServiceBooking');
const GPSTracking = require('../models/GPSTracking');
const { sendNotification } = require('../utils/notificationService');

// Get all service centers
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius, service, city, page = 1, limit = 20 } = req.query;
    const filter = { isApproved: true };

    if (city) {
      filter['location.city'] = new RegExp(city, 'i');
    }

    if (service) {
      filter.services = { $in: [service] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let centers;
    if (lat && lng && radius) {
      // Geospatial query for nearby centers
      centers = await ServiceCenter.find({
        ...filter,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
          }
        }
      }).skip(skip).limit(parseInt(limit));
    } else {
      centers = await ServiceCenter.find(filter)
        .sort({ 'rating.average': -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }

    const total = await ServiceCenter.countDocuments(filter);

    res.json({
      centers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get service center by ID
router.get('/:id', async (req, res) => {
  try {
    const center = await ServiceCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: 'Service center not found' });
    }
    res.json(center);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create service center (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const center = new ServiceCenter({
      ...req.body,
      isApproved: true
    });
    await center.save();
    res.status(201).json({ message: 'Service center created', center });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update service center (Admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const center = await ServiceCenter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!center) {
      return res.status(404).json({ message: 'Service center not found' });
    }
    res.json({ message: 'Service center updated', center });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete service center (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const center = await ServiceCenter.findByIdAndDelete(req.params.id);
    if (!center) {
      return res.status(404).json({ message: 'Service center not found' });
    }
    res.json({ message: 'Service center deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Book a service
router.post('/:id/book', authenticate, async (req, res) => {
  try {
    const { carId, serviceType, scheduledDate, notes } = req.body;

    const center = await ServiceCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: 'Service center not found' });
    }

    const booking = new ServiceBooking({
      serviceCenter: req.params.id,
      customer: req.user._id,
      car: carId,
      serviceType,
      scheduledDate,
      notes
    });

    await booking.save();
    await booking.populate('serviceCenter', 'name location');
    await booking.populate('car', 'make model licensePlate');

    res.status(201).json({ message: 'Service booked successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get my service bookings
router.get('/bookings/my', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { customer: req.user._id };

    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await ServiceBooking.find(filter)
      .populate('serviceCenter', 'name location contact')
      .populate('car', 'make model licensePlate')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ServiceBooking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update service booking status
router.put('/bookings/:bookingId/status', authenticate, async (req, res) => {
  try {
    const { status, cost } = req.body;

    const booking = await ServiceBooking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = status;
    if (cost) booking.cost = cost;
    await booking.save();

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GPS Tracking routes
router.get('/gps/:carId', authenticate, async (req, res) => {
  try {
    const tracking = await GPSTracking.findOne({ car: req.params.carId, isActive: true })
      .populate('car', 'make model licensePlate');

    if (!tracking) {
      return res.status(404).json({ message: 'No active tracking for this car' });
    }

    res.json(tracking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update GPS location
router.put('/gps/:carId/location', authenticate, async (req, res) => {
  try {
    const { lat, lng, speed, heading, address } = req.body;

    let tracking = await GPSTracking.findOne({ car: req.params.carId, isActive: true });

    if (!tracking) {
      return res.status(404).json({ message: 'No active tracking for this car' });
    }

    // Add to history
    tracking.locationHistory.push({
      coordinates: { lat: tracking.currentLocation.coordinates.lat, lng: tracking.currentLocation.coordinates.lng },
      address: tracking.currentLocation.address,
      speed: tracking.speed,
      timestamp: tracking.currentLocation.timestamp
    });

    // Keep only last 100 history entries
    if (tracking.locationHistory.length > 100) {
      tracking.locationHistory = tracking.locationHistory.slice(-100);
    }

    // Update current location
    tracking.currentLocation = {
      coordinates: { lat, lng },
      address,
      timestamp: new Date()
    };
    tracking.speed = speed || 0;
    tracking.heading = heading || 0;
    tracking.updatedAt = new Date();

    await tracking.save();

    res.json({ message: 'Location updated', tracking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get GPS history
router.get('/gps/:carId/history', authenticate, async (req, res) => {
  try {
    const tracking = await GPSTracking.findOne({ car: req.params.carId, isActive: true });

    if (!tracking) {
      return res.status(404).json({ message: 'No active tracking for this car' });
    }

    res.json({
      currentLocation: tracking.currentLocation,
      history: tracking.locationHistory
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
