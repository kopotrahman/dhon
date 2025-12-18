const User = require('../models/User');

// Upload KYC documents
const uploadKYCDocuments = async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    
    user.kyc.documents.push({
      type,
      documentUrl: req.file.path,
      uploadedAt: new Date()
    });

    await user.save();

    res.json({ message: 'Document uploaded successfully', kyc: user.kyc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify KYC (Admin only)
const verifyKYC = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.kyc.isVerified = true;
    user.kyc.verifiedAt = new Date();
    user.kyc.verifiedBy = req.user._id;

    await user.save();

    res.json({ message: 'KYC verified successfully', kyc: user.kyc });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve user (Admin only)
const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = true;
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;

    await user.save();

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get pending approvals (Admin only)
const getPendingApprovals = async (req, res) => {
  try {
    const users = await User.find({ 
      isApproved: false,
      role: { $in: ['owner', 'driver'] }
    }).select('-password');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { uploadKYCDocuments, verifyKYC, approveUser, getPendingApprovals };
