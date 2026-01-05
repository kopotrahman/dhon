const Booking = require('../models/Booking');
const Car = require('../models/Car');
const RateNegotiation = require('../models/RateNegotiation');
const { sendNotification } = require('../utils/notificationService');

// Create booking
const createBooking = async (req, res) => {
  try {
    const { 
      carId, 
      startDate, 
      endDate, 
      rateType, 
      timeSlots,
      pickupLocation, 
      dropoffLocation,
      selfDrive,
      additionalServices,
      notes,
      negotiationId
    } = req.body;

    const car = await Car.findById(carId).populate('owner');
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (!car.forRent) {
      return res.status(400).json({ message: 'Car is not available for rent' });
    }

    // Check for conflicts
    const conflictingBooking = await Booking.checkConflict(carId, new Date(startDate), new Date(endDate));
    if (conflictingBooking) {
      return res.status(400).json({ 
        message: 'Car is already booked for the selected dates',
        conflict: {
          startDate: conflictingBooking.startDate,
          endDate: conflictingBooking.endDate
        }
      });
    }

    // Calculate total amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    let rate, totalHours, totalDays, totalAmount;

    if (rateType === 'hourly') {
      totalHours = timeSlots 
        ? timeSlots.reduce((sum, slot) => sum + slot.hours, 0)
        : (end - start) / (1000 * 60 * 60);
      rate = car.rentRates.hourly;
      totalAmount = totalHours * rate;
    } else {
      totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      rate = car.rentRates.daily;
      totalAmount = totalDays * rate;
    }

    // Add additional services
    if (additionalServices && additionalServices.length > 0) {
      const servicesTotal = additionalServices.reduce((sum, service) => sum + service.price, 0);
      totalAmount += servicesTotal;
    }

    // Check for negotiated rate
    let isNegotiated = false;
    let originalAmount = totalAmount;
    let negotiation = null;

    if (negotiationId) {
      negotiation = await RateNegotiation.findById(negotiationId);
      if (negotiation && negotiation.status === 'accepted') {
        rate = negotiation.proposedRate;
        if (rateType === 'hourly') {
          totalAmount = totalHours * rate;
        } else {
          totalAmount = totalDays * rate;
        }
        if (additionalServices && additionalServices.length > 0) {
          totalAmount += additionalServices.reduce((sum, service) => sum + service.price, 0);
        }
        isNegotiated = true;
      }
    }

    // Calculate deposit (e.g., 20% of total)
    const depositAmount = Math.round(totalAmount * 0.2);

    const booking = new Booking({
      car: carId,
      customer: req.user._id,
      owner: car.owner._id,
      startDate,
      endDate,
      timeSlots: rateType === 'hourly' ? timeSlots : undefined,
      rateType,
      rate,
      totalHours,
      totalDays,
      totalAmount,
      negotiation: negotiationId,
      isNegotiated,
      originalAmount: isNegotiated ? originalAmount : undefined,
      deposit: {
        amount: depositAmount,
        paid: false
      },
      pickupLocation,
      dropoffLocation,
      driver: {
        selfDrive: selfDrive !== false
      },
      additionalServices,
      notes
    });

    await booking.save();

    // Notify car owner
    await sendNotification({
      recipient: car.owner._id,
      type: 'new_booking',
      title: 'New Booking Request',
      message: `${req.user.name} has requested to book your ${car.make} ${car.model}`,
      link: `/dashboard/bookings/${booking._id}`
    });

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all bookings
const getBookings = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    if (req.user.role === 'admin') {
      // Admin sees all
    } else if (req.user.role === 'owner') {
      filter.owner = req.user._id;
    } else {
      filter.customer = req.user._id;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate && endDate) {
      filter.$or = [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
      ];
    }

    const bookings = await Booking.find(filter)
      .populate('car', 'make model year images licensePlate rentRates')
      .populate('customer', 'name email phone profileImage')
      .populate('owner', 'name email phone')
      .populate('negotiation')
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
      .populate('customer', 'name email phone profileImage')
      .populate('owner', 'name email phone')
      .populate('payment')
      .populate('negotiation')
      .populate('driver.assignedDriver', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isOwner = booking.owner._id.toString() === req.user._id.toString();
    const isCustomer = booking.customer._id.toString() === req.user._id.toString();

    if (!isOwner && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get car availability calendar
const getCarCalendar = async (req, res) => {
  try {
    const { carId } = req.params;
    const { month, year } = req.query;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Get the start and end of the month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const bookings = await Booking.getCarBookings(carId, startOfMonth, endOfMonth);

    // Generate calendar data
    const daysInMonth = endOfMonth.getDate();
    const calendar = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayBookings = bookings.filter(b => {
        const bookingStart = new Date(b.startDate);
        const bookingEnd = new Date(b.endDate);
        return date >= bookingStart && date <= bookingEnd;
      });

      calendar.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.getDay(),
        isBooked: dayBookings.length > 0,
        bookings: dayBookings.map(b => ({
          id: b._id,
          status: b.status,
          rateType: b.rateType,
          timeSlots: b.timeSlots
        })),
        rates: {
          hourly: car.rentRates.hourly,
          daily: car.rentRates.daily
        }
      });
    }

    res.json({
      car: {
        id: car._id,
        make: car.make,
        model: car.model,
        rates: car.rentRates
      },
      month,
      year,
      calendar
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get available time slots for a specific date
const getAvailableSlots = async (req, res) => {
  try {
    const { carId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const slots = await Booking.getAvailableSlots(carId, new Date(date));
    
    res.json({
      date,
      slots,
      availableHours: slots.filter(s => s.available).length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update booking status (Owner or Admin)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, ownerNotes } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('customer', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isOwner = booking.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    booking.status = status;
    if (ownerNotes) {
      booking.ownerNotes = ownerNotes;
    }
    await booking.save();

    // Update car availability if booking is confirmed
    if (status === 'confirmed' || status === 'active') {
      await Car.findByIdAndUpdate(booking.car._id, {
        'availability.status': 'rented'
      });
    } else if (status === 'completed' || status === 'cancelled') {
      await Car.findByIdAndUpdate(booking.car._id, {
        'availability.status': 'available'
      });
    }

    // Notify customer
    const statusMessages = {
      confirmed: 'Your booking has been confirmed',
      rejected: 'Your booking request was declined',
      active: 'Your rental has started',
      completed: 'Your rental has been completed'
    };

    if (statusMessages[status]) {
      await sendNotification({
        recipient: booking.customer._id,
        type: 'booking_status',
        title: 'Booking Status Update',
        message: `${statusMessages[status]} for ${booking.car.make} ${booking.car.model}`,
        link: `/dashboard/bookings/${booking._id}`
      });
    }

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate('car')
      .populate('customer', 'name email')
      .populate('owner', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const isCustomer = booking.customer._id.toString() === req.user._id.toString();
    const isOwner = booking.owner._id.toString() === req.user._id.toString();

    if (!isCustomer && !isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    }

    // Calculate refund based on cancellation policy
    let refundAmount = 0;
    const hoursUntilStart = (new Date(booking.startDate) - new Date()) / (1000 * 60 * 60);

    if (hoursUntilStart > 48) {
      refundAmount = booking.totalAmount; // Full refund
    } else if (hoursUntilStart > 24) {
      refundAmount = booking.totalAmount * 0.5; // 50% refund
    } else {
      refundAmount = 0; // No refund
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: req.user._id,
      reason,
      cancelledAt: new Date(),
      refundAmount
    };
    await booking.save();

    // Update car availability
    await Car.findByIdAndUpdate(booking.car._id, {
      'availability.status': 'available'
    });

    // Notify the other party
    const recipientId = isCustomer ? booking.owner._id : booking.customer._id;
    await sendNotification({
      recipient: recipientId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Booking for ${booking.car.make} ${booking.car.model} has been cancelled`,
      link: `/dashboard/bookings/${booking._id}`
    });

    res.json({ 
      message: 'Booking cancelled successfully', 
      booking,
      refundAmount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ==================== RATE NEGOTIATION ====================

// Start rate negotiation
const startNegotiation = async (req, res) => {
  try {
    const { carId, proposedRate, rateType, startDate, endDate, message } = req.body;

    const car = await Car.findById(carId).populate('owner');
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const originalRate = rateType === 'hourly' ? car.rentRates.hourly : car.rentRates.daily;

    if (proposedRate >= originalRate) {
      return res.status(400).json({ message: 'Proposed rate must be lower than the original rate' });
    }

    const negotiation = new RateNegotiation({
      car: carId,
      customer: req.user._id,
      owner: car.owner._id,
      originalRate,
      proposedRate,
      rateType,
      startDate,
      endDate,
      messages: message ? [{
        sender: req.user._id,
        content: message,
        createdAt: new Date()
      }] : [],
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
    });

    await negotiation.save();

    // Notify owner
    await sendNotification({
      recipient: car.owner._id,
      type: 'rate_negotiation',
      title: 'New Rate Negotiation Request',
      message: `${req.user.name} wants to negotiate the rate for your ${car.make} ${car.model}`,
      link: `/dashboard/negotiations/${negotiation._id}`
    });

    res.status(201).json({ message: 'Negotiation started', negotiation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Respond to negotiation (Owner)
const respondToNegotiation = async (req, res) => {
  try {
    const { negotiationId } = req.params;
    const { action, counterRate, message } = req.body;

    const negotiation = await RateNegotiation.findById(negotiationId)
      .populate('car')
      .populate('customer', 'name email');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    if (negotiation.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (negotiation.status !== 'pending' && negotiation.status !== 'countered') {
      return res.status(400).json({ message: 'Negotiation is no longer active' });
    }

    if (action === 'accept') {
      negotiation.status = 'accepted';
      
      await sendNotification({
        recipient: negotiation.customer._id,
        type: 'negotiation_accepted',
        title: 'Rate Negotiation Accepted',
        message: `Your proposed rate for ${negotiation.car.make} ${negotiation.car.model} has been accepted!`,
        link: `/dashboard/negotiations/${negotiation._id}`
      });
    } else if (action === 'reject') {
      negotiation.status = 'rejected';
      
      await sendNotification({
        recipient: negotiation.customer._id,
        type: 'negotiation_rejected',
        title: 'Rate Negotiation Declined',
        message: `Your rate proposal for ${negotiation.car.make} ${negotiation.car.model} was declined`,
        link: `/dashboard/negotiations/${negotiation._id}`
      });
    } else if (action === 'counter' && counterRate) {
      negotiation.status = 'countered';
      negotiation.counterOffers.push({
        proposedBy: req.user._id,
        rate: counterRate,
        message,
        createdAt: new Date()
      });
      negotiation.proposedRate = counterRate;
      
      await sendNotification({
        recipient: negotiation.customer._id,
        type: 'counter_offer',
        title: 'Counter Offer Received',
        message: `The owner has made a counter offer for ${negotiation.car.make} ${negotiation.car.model}`,
        link: `/dashboard/negotiations/${negotiation._id}`
      });
    }

    if (message) {
      negotiation.messages.push({
        sender: req.user._id,
        content: message,
        createdAt: new Date()
      });
    }

    await negotiation.save();

    res.json({ message: 'Response sent', negotiation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Customer responds to counter offer
const respondToCounterOffer = async (req, res) => {
  try {
    const { negotiationId } = req.params;
    const { action, newRate, message } = req.body;

    const negotiation = await RateNegotiation.findById(negotiationId)
      .populate('car')
      .populate('owner', 'name email');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    if (negotiation.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (negotiation.status !== 'countered') {
      return res.status(400).json({ message: 'No counter offer to respond to' });
    }

    if (action === 'accept') {
      negotiation.status = 'accepted';
      
      await sendNotification({
        recipient: negotiation.owner._id,
        type: 'counter_accepted',
        title: 'Counter Offer Accepted',
        message: `${req.user.name} accepted your counter offer for ${negotiation.car.make} ${negotiation.car.model}`,
        link: `/dashboard/negotiations/${negotiation._id}`
      });
    } else if (action === 'counter' && newRate) {
      negotiation.counterOffers.push({
        proposedBy: req.user._id,
        rate: newRate,
        message,
        createdAt: new Date()
      });
      negotiation.proposedRate = newRate;
      negotiation.status = 'pending';
      
      await sendNotification({
        recipient: negotiation.owner._id,
        type: 'new_counter',
        title: 'New Counter Offer',
        message: `${req.user.name} has made a new offer for ${negotiation.car.make} ${negotiation.car.model}`,
        link: `/dashboard/negotiations/${negotiation._id}`
      });
    } else if (action === 'withdraw') {
      negotiation.status = 'expired';
    }

    if (message) {
      negotiation.messages.push({
        sender: req.user._id,
        content: message,
        createdAt: new Date()
      });
    }

    await negotiation.save();

    res.json({ message: 'Response sent', negotiation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get my negotiations
const getMyNegotiations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {
      $or: [
        { customer: req.user._id },
        { owner: req.user._id }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const negotiations = await RateNegotiation.find(filter)
      .populate('car', 'make model images rentRates')
      .populate('customer', 'name email profileImage')
      .populate('owner', 'name email profileImage')
      .sort({ createdAt: -1 });

    res.json(negotiations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send message in negotiation
const sendNegotiationMessage = async (req, res) => {
  try {
    const { negotiationId } = req.params;
    const { content } = req.body;

    const negotiation = await RateNegotiation.findById(negotiationId)
      .populate('car')
      .populate('customer', 'name')
      .populate('owner', 'name');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    const isCustomer = negotiation.customer._id.toString() === req.user._id.toString();
    const isOwner = negotiation.owner._id.toString() === req.user._id.toString();

    if (!isCustomer && !isOwner) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    negotiation.messages.push({
      sender: req.user._id,
      content,
      createdAt: new Date()
    });

    await negotiation.save();

    // Notify the other party
    const recipientId = isCustomer ? negotiation.owner._id : negotiation.customer._id;
    await sendNotification({
      recipient: recipientId,
      type: 'negotiation_message',
      title: 'New Message',
      message: `You have a new message about ${negotiation.car.make} ${negotiation.car.model}`,
      link: `/dashboard/negotiations/${negotiation._id}`
    });

    res.json({ message: 'Message sent', negotiation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  getCarCalendar,
  getAvailableSlots,
  updateBookingStatus,
  cancelBooking,
  startNegotiation,
  respondToNegotiation,
  respondToCounterOffer,
  getMyNegotiations,
  sendNegotiationMessage
};
