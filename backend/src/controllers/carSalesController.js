const Car = require('../models/Car');
const User = require('../models/User');
const TestDrive = require('../models/TestDrive');
const { sendNotification } = require('../utils/notificationService');

// List car for sale
const listCarForSale = async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      price,
      mileage,
      transmission,
      fuelType,
      bodyType,
      color,
      interiorColor,
      vin,
      description,
      features,
      specifications,
      condition,
      history,
      location
    } = req.body;

    const car = new Car({
      owner: req.user._id,
      make,
      model,
      year,
      price,
      mileage,
      transmission,
      fuelType,
      bodyType,
      color,
      interiorColor,
      vin,
      description,
      features,
      specifications,
      condition: condition || 'used',
      history,
      location,
      listingType: 'sale',
      status: 'pending_approval'
    });

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      car.images = req.files.map((file, index) => ({
        url: `/uploads/cars/${file.filename}`,
        isPrimary: index === 0,
        caption: ''
      }));
    }

    await car.save();

    // Notify admin
    await sendNotification({
      recipient: null,
      type: 'system',
      title: 'New Car Listing',
      message: `A new ${year} ${make} ${model} has been listed for sale.`,
      data: { carId: car._id }
    });

    res.status(201).json({
      message: 'Car listed successfully. Pending approval.',
      car
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// List car for rent
const listCarForRent = async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      mileage,
      transmission,
      fuelType,
      bodyType,
      color,
      description,
      features,
      specifications,
      location,
      rentalPricing,
      rentalTerms,
      availability
    } = req.body;

    const car = new Car({
      owner: req.user._id,
      make,
      model,
      year,
      mileage,
      transmission,
      fuelType,
      bodyType,
      color,
      description,
      features,
      specifications,
      location,
      listingType: 'rent',
      rentalPricing: {
        hourly: rentalPricing?.hourly,
        daily: rentalPricing?.daily,
        weekly: rentalPricing?.weekly,
        monthly: rentalPricing?.monthly,
        deposit: rentalPricing?.deposit || 0
      },
      rentalTerms,
      availability: availability || { isAvailable: true },
      status: 'pending_approval'
    });

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      car.images = req.files.map((file, index) => ({
        url: `/uploads/cars/${file.filename}`,
        isPrimary: index === 0
      }));
    }

    await car.save();

    res.status(201).json({
      message: 'Car listed for rent. Pending approval.',
      car
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search cars for sale
const searchCarsForSale = async (req, res) => {
  try {
    const {
      make,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      minMileage,
      maxMileage,
      transmission,
      fuelType,
      bodyType,
      color,
      condition,
      location,
      radius,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    const query = {
      listingType: 'sale',
      status: 'available'
    };

    // Build query filters
    if (make) query.make = { $regex: make, $options: 'i' };
    if (model) query.model = { $regex: model, $options: 'i' };
    if (minYear || maxYear) {
      query.year = {};
      if (minYear) query.year.$gte = parseInt(minYear);
      if (maxYear) query.year.$lte = parseInt(maxYear);
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (minMileage || maxMileage) {
      query.mileage = {};
      if (minMileage) query.mileage.$gte = parseInt(minMileage);
      if (maxMileage) query.mileage.$lte = parseInt(maxMileage);
    }
    if (transmission) query.transmission = transmission;
    if (fuelType) query.fuelType = fuelType;
    if (bodyType) query.bodyType = bodyType;
    if (color) query.color = { $regex: color, $options: 'i' };
    if (condition) query.condition = condition;

    // Location-based search
    if (location && radius) {
      const [lng, lat] = location.split(',').map(Number);
      query['location.coordinates'] = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: parseInt(radius) * 1609.34 // miles to meters
        }
      };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const cars = await Car.find(query)
      .populate('owner', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Car.countDocuments(query);

    res.json({
      cars,
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

// Search cars for rent
const searchCarsForRent = async (req, res) => {
  try {
    const {
      make,
      model,
      minPrice,
      maxPrice,
      transmission,
      fuelType,
      bodyType,
      seats,
      availableFrom,
      availableTo,
      location,
      sortBy = 'rentalPricing.daily',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    const query = {
      listingType: 'rent',
      status: 'available',
      'availability.isAvailable': true
    };

    if (make) query.make = { $regex: make, $options: 'i' };
    if (model) query.model = { $regex: model, $options: 'i' };
    if (minPrice || maxPrice) {
      query['rentalPricing.daily'] = {};
      if (minPrice) query['rentalPricing.daily'].$gte = parseFloat(minPrice);
      if (maxPrice) query['rentalPricing.daily'].$lte = parseFloat(maxPrice);
    }
    if (transmission) query.transmission = transmission;
    if (fuelType) query.fuelType = fuelType;
    if (bodyType) query.bodyType = bodyType;
    if (seats) query['specifications.seats'] = { $gte: parseInt(seats) };

    // Check availability dates
    if (availableFrom || availableTo) {
      // Exclude cars with bookings during the requested period
      // This would require a more complex query with booking data
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const cars = await Car.find(query)
      .populate('owner', 'name rating')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Car.countDocuments(query);

    res.json({
      cars,
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

// Get car details
const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('owner', 'name email phone rating createdAt');

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Increment view count
    car.views = (car.views || 0) + 1;
    await car.save();

    // Get related cars
    const relatedCars = await Car.find({
      _id: { $ne: car._id },
      listingType: car.listingType,
      status: 'available',
      $or: [
        { make: car.make },
        { bodyType: car.bodyType },
        { 
          price: { 
            $gte: car.price * 0.8, 
            $lte: car.price * 1.2 
          } 
        }
      ]
    })
    .limit(6)
    .select('make model year price images');

    res.json({ car, relatedCars });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get my listings
const getMyListings = async (req, res) => {
  try {
    const { listingType, status, page = 1, limit = 10 } = req.query;

    const query = { owner: req.user._id };
    if (listingType) query.listingType = listingType;
    if (status) query.status = status;

    const cars = await Car.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Car.countDocuments(query);

    // Get stats
    const stats = await Car.aggregate([
      { $match: { owner: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      cars,
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

// Update car listing
const updateCarListing = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedUpdates = [
      'price', 'description', 'features', 'specifications',
      'availability', 'rentalPricing', 'rentalTerms', 'location'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        car[field] = req.body[field];
      }
    });

    // Handle new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/cars/${file.filename}`,
        isPrimary: false
      }));
      car.images.push(...newImages);
    }

    await car.save();

    res.json({ message: 'Listing updated', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete/deactivate car listing
const deleteCarListing = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check for active bookings or test drives
    const activeTestDrives = await TestDrive.countDocuments({
      car: car._id,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (activeTestDrives > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete car with active test drives' 
      });
    }

    // Soft delete
    car.status = 'deleted';
    car.deletedAt = new Date();
    await car.save();

    res.json({ message: 'Listing deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark car as sold
const markAsSold = async (req, res) => {
  try {
    const { soldPrice, buyerInfo } = req.body;

    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    car.status = 'sold';
    car.soldAt = new Date();
    car.soldPrice = soldPrice || car.price;
    car.buyerInfo = buyerInfo;

    await car.save();

    // Cancel any pending test drives
    await TestDrive.updateMany(
      { car: car._id, status: { $in: ['scheduled', 'confirmed'] } },
      { 
        status: 'cancelled',
        $push: { 
          statusHistory: { 
            status: 'cancelled', 
            note: 'Car has been sold' 
          } 
        } 
      }
    );

    res.json({ message: 'Car marked as sold', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send inquiry about a car
const sendInquiry = async (req, res) => {
  try {
    const { message, contactPreference } = req.body;

    const car = await Car.findById(req.params.id).populate('owner', 'name email');
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Create inquiry record
    car.inquiries = car.inquiries || [];
    car.inquiries.push({
      from: req.user._id,
      message,
      contactPreference,
      createdAt: new Date()
    });
    await car.save();

    // Notify car owner
    await sendNotification({
      recipient: car.owner._id,
      type: 'message',
      title: 'New Inquiry',
      message: `Someone is interested in your ${car.year} ${car.make} ${car.model}`,
      data: { carId: car._id, fromUser: req.user._id }
    });

    res.json({ message: 'Inquiry sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get inquiries for my cars
const getMyInquiries = async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user._id })
      .populate('inquiries.from', 'name email phone')
      .select('make model year images inquiries');

    const allInquiries = cars.flatMap(car => 
      (car.inquiries || []).map(inquiry => ({
        ...inquiry.toObject(),
        car: {
          _id: car._id,
          make: car.make,
          model: car.model,
          year: car.year,
          image: car.images?.[0]?.url
        }
      }))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ inquiries: allInquiries });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get featured cars
const getFeaturedCars = async (req, res) => {
  try {
    const { listingType } = req.query;

    const query = { 
      status: 'available',
      isFeatured: true
    };
    if (listingType) query.listingType = listingType;

    const cars = await Car.find(query)
      .populate('owner', 'name rating')
      .sort({ featuredAt: -1 })
      .limit(12);

    res.json({ cars });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get popular makes and models
const getPopularMakes = async (req, res) => {
  try {
    const makes = await Car.aggregate([
      { $match: { status: 'available' } },
      {
        $group: {
          _id: '$make',
          count: { $sum: 1 },
          models: { $addToSet: '$model' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({ makes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// === ADMIN FUNCTIONS ===

// Approve car listing
const approveCarListing = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (status === 'approved') {
      car.status = 'available';
      car.approvedAt = new Date();
      car.approvedBy = req.user._id;
    } else if (status === 'rejected') {
      car.status = 'rejected';
      car.rejectionReason = rejectionReason;
    }

    await car.save();

    // Notify owner
    await sendNotification({
      recipient: car.owner,
      type: 'system',
      title: `Car Listing ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: status === 'approved'
        ? `Your ${car.year} ${car.make} ${car.model} is now live!`
        : `Your car listing was rejected. ${rejectionReason || ''}`,
      data: { carId: car._id }
    });

    res.json({ message: `Car listing ${status}`, car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get pending car listings
const getPendingListings = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const cars = await Car.find({ status: 'pending_approval' })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Car.countDocuments({ status: 'pending_approval' });

    res.json({
      cars,
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

// Feature/unfeature car
const toggleFeatured = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.isFeatured = !car.isFeatured;
    car.featuredAt = car.isFeatured ? new Date() : null;
    await car.save();

    res.json({ 
      message: car.isFeatured ? 'Car featured' : 'Car unfeatured',
      car 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get car sales analytics
const getCarAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Listings over time
    const listingsByDate = await Car.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Status breakdown
    const statusBreakdown = await Car.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Listing type breakdown
    const typeBreakdown = await Car.aggregate([
      { $match: { status: 'available' } },
      {
        $group: {
          _id: '$listingType',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      }
    ]);

    // Popular makes
    const popularMakes = await Car.aggregate([
      { $match: { status: 'available' } },
      {
        $group: {
          _id: '$make',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Sales stats
    const salesStats = await Car.aggregate([
      { $match: { status: 'sold', soldAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalSold: { $sum: 1 },
          totalRevenue: { $sum: '$soldPrice' },
          avgSalePrice: { $avg: '$soldPrice' }
        }
      }
    ]);

    res.json({
      period,
      listingsByDate,
      statusBreakdown: statusBreakdown.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      typeBreakdown: typeBreakdown.reduce((acc, t) => ({ 
        ...acc, 
        [t._id]: { count: t.count, avgPrice: t.avgPrice } 
      }), {}),
      popularMakes,
      sales: salesStats[0] || { totalSold: 0, totalRevenue: 0, avgSalePrice: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  // Seller functions
  listCarForSale,
  listCarForRent,
  getMyListings,
  updateCarListing,
  deleteCarListing,
  markAsSold,
  getMyInquiries,
  
  // Buyer/public functions
  searchCarsForSale,
  searchCarsForRent,
  getCarById,
  sendInquiry,
  getFeaturedCars,
  getPopularMakes,
  
  // Admin functions
  approveCarListing,
  getPendingListings,
  toggleFeatured,
  getCarAnalytics
};
