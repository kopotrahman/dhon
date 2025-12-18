const Car = require('../models/Car');

// Create car
const createCar = async (req, res) => {
  try {
    const carData = {
      ...req.body,
      owner: req.user._id
    };

    if (req.files && req.files.length > 0) {
      carData.images = req.files.map(file => file.path);
    }

    const car = new Car(carData);
    await car.save();

    res.status(201).json({ message: 'Car created successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all cars
const getCars = async (req, res) => {
  try {
    const { make, model, fuelType, transmission, forSale, forRent, minPrice, maxPrice } = req.query;
    const filter = { isApproved: true };

    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (forSale === 'true') filter.forSale = true;
    if (forRent === 'true') filter.forRent = true;
    if (minPrice) filter.salePrice = { $gte: parseFloat(minPrice) };
    if (maxPrice) filter.salePrice = { ...filter.salePrice, $lte: parseFloat(maxPrice) };

    const cars = await Car.find(filter)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get car by ID
const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('owner', 'name email phone');

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update car
const updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updateData = { ...req.body };
    
    if (req.files && req.files.length > 0) {
      updateData.images = [...car.images, ...req.files.map(file => file.path)];
    }

    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ message: 'Car updated successfully', car: updatedCar });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete car
const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Car.findByIdAndDelete(req.params.id);

    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload car documents
const uploadCarDocument = async (req, res) => {
  try {
    const { carId } = req.params;
    const { type, documentNumber, issueDate, expiryDate } = req.body;

    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    car.documents.push({
      type,
      documentNumber,
      documentUrl: req.file.path,
      issueDate,
      expiryDate
    });

    await car.save();

    res.json({ message: 'Document uploaded successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify car document (Admin only)
const verifyCarDocument = async (req, res) => {
  try {
    const { carId, documentId } = req.params;

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const document = car.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.isVerified = true;
    document.verifiedAt = new Date();
    document.verifiedBy = req.user._id;

    await car.save();

    res.json({ message: 'Document verified successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve car (Admin only)
const approveCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    car.isApproved = true;
    car.approvedBy = req.user._id;

    await car.save();

    res.json({ message: 'Car approved successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createCar,
  getCars,
  getCarById,
  updateCar,
  deleteCar,
  uploadCarDocument,
  verifyCarDocument,
  approveCar
};
