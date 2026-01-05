const Car = require('../models/Car');
const { sendNotification } = require('../utils/notificationService');

// Create car
const createCar = async (req, res) => {
  try {
    const carData = {
      ...req.body,
      owner: req.user._id
    };

    if (req.files && req.files.length > 0) {
      carData.images = req.files.map((file, index) => ({
        url: file.path,
        isPrimary: index === 0,
        uploadedAt: new Date()
      }));
    }

    const car = new Car(carData);
    await car.save();

    // Notify admins about new car for approval
    await sendNotification({
      recipient: null, // Sends to all admins
      type: 'new_car',
      title: 'New Car Pending Approval',
      message: `${req.user.name} has added a new ${carData.make} ${carData.model} for approval`,
      link: `/admin/cars/${car._id}`
    });

    res.status(201).json({ message: 'Car created successfully. Pending admin approval.', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get my cars (Owner)
const getMyCars = async (req, res) => {
  try {
    const { status, approvalStatus } = req.query;
    const filter = { owner: req.user._id };

    if (status) filter['availability.status'] = status;
    if (approvalStatus) filter.approvalStatus = approvalStatus;

    const cars = await Car.find(filter).sort({ createdAt: -1 });
    res.json(cars);
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
    const { type, name, documentNumber, issueDate, expiryDate, notes } = req.body;

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

    // Check if document type already exists
    const existingDocIndex = car.documents.findIndex(doc => doc.type === type);
    
    const documentData = {
      type,
      name: name || type.toUpperCase(),
      documentNumber,
      documentUrl: req.file.path,
      issueDate,
      expiryDate,
      verificationStatus: 'pending',
      isVerified: false,
      notes,
      uploadedAt: new Date()
    };

    if (existingDocIndex !== -1) {
      // Update existing document
      car.documents[existingDocIndex] = {
        ...car.documents[existingDocIndex].toObject(),
        ...documentData
      };
    } else {
      // Add new document
      car.documents.push(documentData);
    }

    await car.save();

    // Notify admins about new document for verification
    await sendNotification({
      recipient: null,
      type: 'document_uploaded',
      title: 'Document Pending Verification',
      message: `${type.toUpperCase()} document uploaded for ${car.make} ${car.model}`,
      link: `/admin/cars/${car._id}/documents`
    });

    res.json({ message: 'Document uploaded successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update car document
const updateCarDocument = async (req, res) => {
  try {
    const { carId, documentId } = req.params;
    const { documentNumber, issueDate, expiryDate, notes } = req.body;

    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const document = car.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (documentNumber) document.documentNumber = documentNumber;
    if (issueDate) document.issueDate = issueDate;
    if (expiryDate) document.expiryDate = expiryDate;
    if (notes) document.notes = notes;
    
    // If document details changed, reset verification
    if (req.file) {
      document.documentUrl = req.file.path;
      document.verificationStatus = 'pending';
      document.isVerified = false;
      document.uploadedAt = new Date();
    }

    await car.save();

    res.json({ message: 'Document updated successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete car document
const deleteCarDocument = async (req, res) => {
  try {
    const { carId, documentId } = req.params;

    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    car.documents.pull(documentId);
    await car.save();

    res.json({ message: 'Document deleted successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify car document (Admin only)
const verifyCarDocument = async (req, res) => {
  try {
    const { carId, documentId } = req.params;
    const { action, rejectionReason } = req.body;

    const car = await Car.findById(carId).populate('owner', 'name email');
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const document = car.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (action === 'approve') {
      document.isVerified = true;
      document.verificationStatus = 'approved';
      document.verifiedAt = new Date();
      document.verifiedBy = req.user._id;

      await sendNotification({
        recipient: car.owner._id,
        type: 'document_approved',
        title: 'Document Approved',
        message: `Your ${document.type.toUpperCase()} document for ${car.make} ${car.model} has been verified`,
        link: `/dashboard/cars/${car._id}/documents`
      });
    } else if (action === 'reject') {
      document.isVerified = false;
      document.verificationStatus = 'rejected';
      document.rejectionReason = rejectionReason;
      document.verifiedAt = new Date();
      document.verifiedBy = req.user._id;

      await sendNotification({
        recipient: car.owner._id,
        type: 'document_rejected',
        title: 'Document Rejected',
        message: `Your ${document.type.toUpperCase()} document for ${car.make} ${car.model} was rejected. Reason: ${rejectionReason}`,
        link: `/dashboard/cars/${car._id}/documents`
      });
    }

    await car.save();

    res.json({ message: `Document ${action}d successfully`, car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get expiring documents
const getExpiringDocuments = async (req, res) => {
  try {
    const { daysAhead = 30 } = req.query;
    
    let filter = {};
    if (req.user.role !== 'admin') {
      filter = { owner: req.user._id };
    }

    const cars = await Car.find(filter).populate('owner', 'name email');
    
    const expiringDocs = [];
    const expiredDocs = [];

    cars.forEach(car => {
      const expiring = car.getExpiringDocuments(parseInt(daysAhead));
      const expired = car.getExpiredDocuments();

      expiring.forEach(doc => {
        expiringDocs.push({
          car: {
            id: car._id,
            make: car.make,
            model: car.model,
            licensePlate: car.licensePlate
          },
          owner: car.owner,
          document: doc
        });
      });

      expired.forEach(doc => {
        expiredDocs.push({
          car: {
            id: car._id,
            make: car.make,
            model: car.model,
            licensePlate: car.licensePlate
          },
          owner: car.owner,
          document: doc
        });
      });
    });

    res.json({ 
      expiring: expiringDocs.sort((a, b) => new Date(a.document.expiryDate) - new Date(b.document.expiryDate)),
      expired: expiredDocs
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all documents pending verification (Admin only)
const getPendingDocuments = async (req, res) => {
  try {
    const cars = await Car.find({
      'documents.verificationStatus': 'pending'
    }).populate('owner', 'name email phone');

    const pendingDocs = [];

    cars.forEach(car => {
      car.documents.forEach(doc => {
        if (doc.verificationStatus === 'pending') {
          pendingDocs.push({
            car: {
              id: car._id,
              make: car.make,
              model: car.model,
              licensePlate: car.licensePlate
            },
            owner: car.owner,
            document: doc
          });
        }
      });
    });

    res.json(pendingDocs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve car (Admin only)
const approveCar = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const car = await Car.findById(req.params.id).populate('owner', 'name email');
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (action === 'approve') {
      car.isApproved = true;
      car.approvalStatus = 'approved';
      car.approvedBy = req.user._id;
      car.approvedAt = new Date();

      await sendNotification({
        recipient: car.owner._id,
        type: 'car_approved',
        title: 'Car Approved',
        message: `Your ${car.make} ${car.model} has been approved and is now visible to customers`,
        link: `/dashboard/cars/${car._id}`
      });
    } else if (action === 'reject') {
      car.isApproved = false;
      car.approvalStatus = 'rejected';
      car.rejectionReason = rejectionReason;

      await sendNotification({
        recipient: car.owner._id,
        type: 'car_rejected',
        title: 'Car Listing Rejected',
        message: `Your ${car.make} ${car.model} listing was rejected. Reason: ${rejectionReason}`,
        link: `/dashboard/cars/${car._id}`
      });
    } else if (action === 'suspend') {
      car.isApproved = false;
      car.approvalStatus = 'suspended';
      car.rejectionReason = rejectionReason;

      await sendNotification({
        recipient: car.owner._id,
        type: 'car_suspended',
        title: 'Car Listing Suspended',
        message: `Your ${car.make} ${car.model} listing has been suspended. Reason: ${rejectionReason}`,
        link: `/dashboard/cars/${car._id}`
      });
    }

    await car.save();

    res.json({ message: `Car ${action}d successfully`, car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get cars pending approval (Admin only)
const getPendingCars = async (req, res) => {
  try {
    const cars = await Car.find({ approvalStatus: 'pending' })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Block dates for car
const blockDates = async (req, res) => {
  try {
    const { carId } = req.params;
    const { startDate, endDate, reason } = req.body;

    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    car.blockedDates.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await car.save();

    res.json({ message: 'Dates blocked successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove blocked dates
const unblockDates = async (req, res) => {
  try {
    const { carId, blockId } = req.params;

    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    car.blockedDates.pull(blockId);
    await car.save();

    res.json({ message: 'Dates unblocked successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update car availability
const updateAvailability = async (req, res) => {
  try {
    const { carId } = req.params;
    const { status, nextAvailableDate, unavailableReason } = req.body;

    const car = await Car.findById(carId);
    
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    car.availability = {
      status,
      nextAvailableDate: nextAvailableDate ? new Date(nextAvailableDate) : undefined,
      unavailableReason
    };

    await car.save();

    res.json({ message: 'Availability updated successfully', car });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createCar,
  getCars,
  getCarById,
  getMyCars,
  updateCar,
  deleteCar,
  uploadCarDocument,
  updateCarDocument,
  deleteCarDocument,
  verifyCarDocument,
  getExpiringDocuments,
  getPendingDocuments,
  approveCar,
  getPendingCars,
  blockDates,
  unblockDates,
  updateAvailability
};
