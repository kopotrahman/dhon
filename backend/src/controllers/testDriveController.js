const TestDrive = require('../models/TestDrive');
const Car = require('../models/Car');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationService');
const { sendEmail } = require('../utils/emailService');

// Schedule a test drive
const scheduleTestDrive = async (req, res) => {
  try {
    const {
      carId,
      scheduledTime,
      duration,
      locationType,
      pickupLocation,
      notes
    } = req.body;

    // Check if car exists and is available for test drives
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.status !== 'available') {
      return res.status(400).json({ message: 'Car is not available for test drives' });
    }

    // Check for scheduling conflicts
    const startTime = new Date(scheduledTime.start);
    const endTime = new Date(scheduledTime.end || startTime.getTime() + (duration || 60) * 60000);

    const conflict = await TestDrive.findOne({
      car: carId,
      status: { $in: ['scheduled', 'confirmed'] },
      $or: [
        {
          'scheduledTime.start': { $lt: endTime },
          'scheduledTime.end': { $gt: startTime }
        }
      ]
    });

    if (conflict) {
      return res.status(400).json({ 
        message: 'This time slot is not available',
        nextAvailable: conflict.scheduledTime.end
      });
    }

    // Create test drive
    const testDrive = new TestDrive({
      car: carId,
      customer: req.user._id,
      owner: car.owner,
      scheduledTime: {
        start: startTime,
        end: endTime
      },
      duration: duration || 60,
      locationType: locationType || 'dealership',
      pickupLocation: locationType === 'pickup' ? pickupLocation : undefined,
      customerInfo: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        hasValidLicense: req.body.hasValidLicense || false
      },
      notes: {
        customer: notes
      },
      statusHistory: [{
        status: 'scheduled',
        note: 'Test drive scheduled'
      }]
    });

    await testDrive.save();

    // Send notifications
    await sendNotification({
      recipient: req.user._id,
      type: 'booking',
      title: 'Test Drive Scheduled',
      message: `Your test drive for ${car.make} ${car.model} has been scheduled.`,
      data: { testDriveId: testDrive._id, carId }
    });

    // Notify car owner
    if (car.owner) {
      await sendNotification({
        recipient: car.owner,
        type: 'booking',
        title: 'New Test Drive Request',
        message: `Someone has scheduled a test drive for your ${car.make} ${car.model}.`,
        data: { testDriveId: testDrive._id }
      });
    }

    // Send confirmation email
    await sendEmail({
      to: req.user.email,
      subject: 'Test Drive Confirmation',
      template: 'testDriveConfirmation',
      data: {
        name: req.user.name,
        car: `${car.year} ${car.make} ${car.model}`,
        date: startTime.toLocaleDateString(),
        time: startTime.toLocaleTimeString(),
        location: locationType === 'dealership' ? 'Dealership' : pickupLocation
      }
    });

    res.status(201).json({
      message: 'Test drive scheduled successfully',
      testDrive
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's test drives
const getMyTestDrives = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { customer: req.user._id };
    if (status) query.status = status;

    const testDrives = await TestDrive.find(query)
      .populate('car', 'make model year images price')
      .sort({ 'scheduledTime.start': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TestDrive.countDocuments(query);

    res.json({
      testDrives,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get test drive by ID
const getTestDriveById = async (req, res) => {
  try {
    const testDrive = await TestDrive.findById(req.params.id)
      .populate('car', 'make model year images price mileage transmission fuelType')
      .populate('customer', 'name email phone')
      .populate('owner', 'name email phone');

    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive not found' });
    }

    // Authorization check
    const isOwner = testDrive.owner?.toString() === req.user._id.toString();
    const isCustomer = testDrive.customer._id.toString() === req.user._id.toString();
    
    if (!isOwner && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(testDrive);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Confirm test drive (owner/admin)
const confirmTestDrive = async (req, res) => {
  try {
    const testDrive = await TestDrive.findById(req.params.id)
      .populate('car', 'make model year')
      .populate('customer', 'name email');

    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive not found' });
    }

    // Authorization
    if (testDrive.owner?.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (testDrive.status !== 'scheduled') {
      return res.status(400).json({ message: 'Test drive cannot be confirmed' });
    }

    testDrive.status = 'confirmed';
    testDrive.statusHistory.push({
      status: 'confirmed',
      changedBy: req.user._id,
      note: 'Confirmed by owner'
    });
    
    await testDrive.save();

    // Notify customer
    await sendNotification({
      recipient: testDrive.customer._id,
      type: 'booking',
      title: 'Test Drive Confirmed',
      message: `Your test drive for ${testDrive.car.make} ${testDrive.car.model} has been confirmed.`,
      data: { testDriveId: testDrive._id }
    });

    res.json({ message: 'Test drive confirmed', testDrive });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reschedule test drive
const rescheduleTestDrive = async (req, res) => {
  try {
    const { newStart, newEnd, reason } = req.body;

    const testDrive = await TestDrive.findById(req.params.id)
      .populate('car', 'make model')
      .populate('customer', 'name email');

    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive not found' });
    }

    // Check authorization
    const isOwner = testDrive.owner?.toString() === req.user._id.toString();
    const isCustomer = testDrive.customer._id.toString() === req.user._id.toString();
    
    if (!isOwner && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['scheduled', 'confirmed'].includes(testDrive.status)) {
      return res.status(400).json({ message: 'Test drive cannot be rescheduled' });
    }

    // Check for conflicts
    const startTime = new Date(newStart);
    const endTime = new Date(newEnd || startTime.getTime() + testDrive.duration * 60000);

    const conflict = await TestDrive.findOne({
      _id: { $ne: testDrive._id },
      car: testDrive.car._id,
      status: { $in: ['scheduled', 'confirmed'] },
      'scheduledTime.start': { $lt: endTime },
      'scheduledTime.end': { $gt: startTime }
    });

    if (conflict) {
      return res.status(400).json({ message: 'New time slot not available' });
    }

    // Store reschedule info
    testDrive.rescheduleInfo = {
      originalTime: { ...testDrive.scheduledTime },
      reason,
      rescheduledBy: req.user._id,
      rescheduledAt: new Date()
    };

    testDrive.scheduledTime = {
      start: startTime,
      end: endTime
    };

    testDrive.status = 'scheduled';
    testDrive.statusHistory.push({
      status: 'rescheduled',
      changedBy: req.user._id,
      note: reason || 'Rescheduled'
    });

    await testDrive.save();

    // Notify the other party
    const notifyUser = isCustomer ? testDrive.owner : testDrive.customer._id;
    if (notifyUser) {
      await sendNotification({
        recipient: notifyUser,
        type: 'booking',
        title: 'Test Drive Rescheduled',
        message: `Test drive for ${testDrive.car.make} ${testDrive.car.model} has been rescheduled to ${startTime.toLocaleString()}.`,
        data: { testDriveId: testDrive._id }
      });
    }

    res.json({ message: 'Test drive rescheduled', testDrive });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel test drive
const cancelTestDrive = async (req, res) => {
  try {
    const { reason } = req.body;

    const testDrive = await TestDrive.findById(req.params.id)
      .populate('car', 'make model')
      .populate('customer', 'name email');

    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive not found' });
    }

    // Authorization
    const isOwner = testDrive.owner?.toString() === req.user._id.toString();
    const isCustomer = testDrive.customer._id.toString() === req.user._id.toString();
    
    if (!isOwner && !isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['completed', 'cancelled'].includes(testDrive.status)) {
      return res.status(400).json({ message: 'Test drive cannot be cancelled' });
    }

    testDrive.status = 'cancelled';
    testDrive.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      note: reason || 'Cancelled'
    });

    await testDrive.save();

    // Notify the other party
    const notifyUser = isCustomer ? testDrive.owner : testDrive.customer._id;
    if (notifyUser) {
      await sendNotification({
        recipient: notifyUser,
        type: 'booking',
        title: 'Test Drive Cancelled',
        message: `Test drive for ${testDrive.car.make} ${testDrive.car.model} has been cancelled. ${reason || ''}`,
        data: { testDriveId: testDrive._id }
      });
    }

    res.json({ message: 'Test drive cancelled', testDrive });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Complete test drive (owner/admin)
const completeTestDrive = async (req, res) => {
  try {
    const { actualDuration, mileageDriven, notes, vehicleCondition } = req.body;

    const testDrive = await TestDrive.findById(req.params.id);
    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive not found' });
    }

    // Authorization
    if (testDrive.owner?.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (testDrive.status !== 'confirmed') {
      return res.status(400).json({ message: 'Test drive must be confirmed first' });
    }

    testDrive.status = 'completed';
    testDrive.completedAt = new Date();
    testDrive.actualDuration = actualDuration || testDrive.duration;
    testDrive.mileageDriven = mileageDriven;
    testDrive.vehicleCondition = vehicleCondition || 'good';
    testDrive.notes.staff = notes;
    testDrive.statusHistory.push({
      status: 'completed',
      changedBy: req.user._id,
      note: 'Test drive completed'
    });

    // Add reminder for feedback
    testDrive.reminders.push({
      type: 'feedback_request',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours later
      message: 'Please share your feedback about the test drive'
    });

    await testDrive.save();

    // Request feedback from customer
    await sendNotification({
      recipient: testDrive.customer,
      type: 'booking',
      title: 'How was your test drive?',
      message: 'Please share your feedback about your recent test drive.',
      data: { testDriveId: testDrive._id }
    });

    res.json({ message: 'Test drive completed', testDrive });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit feedback
const submitFeedback = async (req, res) => {
  try {
    const { 
      overallExperience, 
      vehicleConditionRating, 
      staffRating,
      wouldRecommend,
      interestedInPurchase,
      comments 
    } = req.body;

    const testDrive = await TestDrive.findById(req.params.id);
    if (!testDrive) {
      return res.status(404).json({ message: 'Test drive not found' });
    }

    if (testDrive.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (testDrive.status !== 'completed') {
      return res.status(400).json({ message: 'Test drive must be completed first' });
    }

    testDrive.feedback = {
      overallExperience,
      vehicleConditionRating,
      staffRating,
      wouldRecommend,
      interestedInPurchase,
      comments,
      submittedAt: new Date()
    };

    await testDrive.save();

    res.json({ message: 'Feedback submitted', testDrive });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get available slots for a car
const getAvailableSlots = async (req, res) => {
  try {
    const { carId, date } = req.query;

    if (!carId || !date) {
      return res.status(400).json({ message: 'Car ID and date required' });
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Get booked slots
    const bookedSlots = await TestDrive.find({
      car: carId,
      status: { $in: ['scheduled', 'confirmed'] },
      'scheduledTime.start': { $gte: startOfDay, $lte: endOfDay }
    }).select('scheduledTime');

    // Generate available slots (9 AM - 6 PM, 1-hour slots)
    const availableSlots = [];
    const slotDuration = 60; // minutes
    
    for (let hour = 9; hour < 18; hour++) {
      const slotStart = new Date(startOfDay);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
      
      // Check if this slot conflicts with any booked slot
      const isBooked = bookedSlots.some(booked => {
        const bookedStart = new Date(booked.scheduledTime.start);
        const bookedEnd = new Date(booked.scheduledTime.end);
        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      if (!isBooked && slotStart > new Date()) {
        availableSlots.push({
          start: slotStart,
          end: slotEnd,
          available: true
        });
      }
    }

    res.json({ date: date, availableSlots });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get owner's test drive requests
const getOwnerTestDrives = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { owner: req.user._id };
    if (status) query.status = status;

    const testDrives = await TestDrive.find(query)
      .populate('car', 'make model year images')
      .populate('customer', 'name email phone')
      .sort({ 'scheduledTime.start': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TestDrive.countDocuments(query);

    res.json({
      testDrives,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Get all test drives
const getAllTestDrives = async (req, res) => {
  try {
    const { status, carId, customerId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (carId) query.car = carId;
    if (customerId) query.customer = customerId;
    if (startDate || endDate) {
      query['scheduledTime.start'] = {};
      if (startDate) query['scheduledTime.start'].$gte = new Date(startDate);
      if (endDate) query['scheduledTime.start'].$lte = new Date(endDate);
    }

    const testDrives = await TestDrive.find(query)
      .populate('car', 'make model year')
      .populate('customer', 'name email')
      .populate('owner', 'name')
      .sort({ 'scheduledTime.start': -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TestDrive.countDocuments(query);

    // Stats
    const stats = await TestDrive.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      testDrives,
      stats: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  scheduleTestDrive,
  getMyTestDrives,
  getTestDriveById,
  confirmTestDrive,
  rescheduleTestDrive,
  cancelTestDrive,
  completeTestDrive,
  submitFeedback,
  getAvailableSlots,
  getOwnerTestDrives,
  getAllTestDrives
};
