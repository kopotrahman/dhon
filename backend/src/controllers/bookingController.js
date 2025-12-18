const Booking = require('../models/Booking');
const Car = require('../models/Car');

// Create booking
const createBooking = async (req, res) => {
  try {
    const { carId, startDate, endDate, rateType, pickupLocation, dropoffLocation } = req.body;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (!car.forRent) {
      return res.status(400).json({ message: 'Car is not available for rent' });
    }

    // Check for conflicts
    const hasConflict = await Booking.checkConflict(carId, new Date(startDate), new Date(endDate));
    if (hasConflict) {
      return res.status(400).json({ message: 'Car is already booked for the selected dates' });
    }

    // Calculate total amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = rateType === 'hourly' 
      ? (end - start) / (1000 * 60 * 60)
      : Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const rate = rateType === 'hourly' ? car.rentRates.hourly : car.rentRates.daily;
    const totalAmount = duration * rate;

    const booking = new Booking({
      car: carId,
      customer: req.user._id,
      startDate,
      endDate,
      rateType,
      totalAmount,
      pickupLocation,
      dropoffLocation
    });

    await booking.save();

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all bookings
const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (req.user.role !== 'admin') {
      filter.customer = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate('car')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('customer', 'name email phone')
      .populate('payment');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customer._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    await booking.save();

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
};
