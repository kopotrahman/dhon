const Review = require('../models/Review');
const User = require('../models/User');
const Product = require('../models/Product');
const Car = require('../models/Car');
const { sendNotification } = require('../utils/notificationService');

// Create review
const createReview = async (req, res) => {
  try {
    const { targetType, targetId, rating, feedback } = req.body;

    // Validate target exists
    let target;
    switch (targetType) {
      case 'driver':
        target = await User.findById(targetId);
        break;
      case 'product':
        target = await Product.findById(targetId);
        break;
      case 'car':
        target = await Car.findById(targetId);
        break;
      default:
        return res.status(400).json({ message: 'Invalid target type' });
    }

    if (!target) {
      return res.status(404).json({ message: `${targetType} not found` });
    }

    // Check if user already reviewed this target
    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      target: targetId,
      targetType
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this item' });
    }

    const review = new Review({
      reviewer: req.user._id,
      targetType,
      target: targetId,
      rating,
      feedback,
      isVerified: true // Verified because user is authenticated
    });

    await review.save();

    // Update target's rating
    await updateTargetRating(targetType, targetId);

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update target rating
const updateTargetRating = async (targetType, targetId) => {
  const reviews = await Review.find({ target: targetId, targetType, isApproved: true });
  
  if (reviews.length === 0) return;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const count = reviews.length;

  switch (targetType) {
    case 'driver':
      await User.findByIdAndUpdate(targetId, {
        'ratings.average': Math.round(average * 10) / 10,
        'ratings.count': count
      });
      break;
    case 'product':
      await Product.findByIdAndUpdate(targetId, {
        'ratings.average': Math.round(average * 10) / 10,
        'ratings.count': count
      });
      break;
    case 'car':
      await Car.findByIdAndUpdate(targetId, {
        'ratings.average': Math.round(average * 10) / 10,
        'ratings.count': count
      });
      break;
  }
};

// Get reviews for target
const getReviews = async (req, res) => {
  try {
    const { targetType, targetId, page = 1, limit = 10 } = req.query;
    const filter = { isApproved: true };

    if (targetType) filter.targetType = targetType;
    if (targetId) filter.target = targetId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find(filter)
      .populate('reviewer', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      reviews,
      ratingDistribution,
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
};

// Get review by ID
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'name profilePhoto')
      .populate('target');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    review.rating = rating || review.rating;
    review.feedback = feedback || review.feedback;
    await review.save();

    // Update target rating
    await updateTargetRating(review.targetType, review.target);

    res.json({ message: 'Review updated successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { targetType, target } = review;
    await Review.findByIdAndDelete(req.params.id);

    // Update target rating
    await updateTargetRating(targetType, target);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Moderate review (Admin only)
const moderateReview = async (req, res) => {
  try {
    const { isApproved, moderationNote } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isApproved = isApproved;
    review.moderatedBy = req.user._id;
    await review.save();

    // Update target rating if approval status changed
    await updateTargetRating(review.targetType, review.target);

    // Notify reviewer
    if (!isApproved) {
      await sendNotification({
        recipient: review.reviewer,
        type: 'system',
        title: 'Review Moderated',
        message: `Your review has been removed. ${moderationNote || ''}`
      });
    }

    res.json({ message: 'Review moderated successfully', review });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get pending reviews (Admin only)
const getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: false })
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  moderateReview,
  getPendingReviews
};
