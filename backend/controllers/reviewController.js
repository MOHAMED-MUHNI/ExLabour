const Review = require('../models/Review');
const Task = require('../models/Task');
const User = require('../models/User');
const NotificationService = require('../utils/notificationService');
const { body, param, validationResult } = require('express-validator');

// Validation rules
const createReviewValidation = [
  param('taskId').isMongoId().withMessage('Invalid task ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean'),
];

const getReviewValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
];

// @desc    Create review for completed task
// @route   POST /api/reviews/task/:taskId
const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { rating, comment, isAnonymous } = req.body;
    const { taskId } = req.params;

    // Verify task exists and is completed
    const task = await Task.findById(taskId).populate('userId assignedTaskerId');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.taskStatus !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed tasks' });
    }

    // Determine review type and target
    let reviewType, targetUserId;
    const reviewerId = req.user._id;

    if (task.userId._id.toString() === reviewerId.toString()) {
      // Task owner reviewing tasker
      reviewType = 'task_owner_to_tasker';
      targetUserId = task.assignedTaskerId;
    } else if (task.assignedTaskerId._id.toString() === reviewerId.toString()) {
      // Tasker reviewing task owner
      reviewType = 'tasker_to_owner';
      targetUserId = task.userId._id;
    } else {
      return res.status(403).json({ success: false, message: 'You are not involved in this task' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ taskId, reviewerId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this task' });
    }

    // Create review
    const review = await Review.create({
      taskId,
      reviewerId,
      targetUserId,
      rating,
      comment: comment || '',
      reviewType,
      isAnonymous: isAnonymous || false,
    });

    // Update user's average rating
    const reviews = await Review.find({ targetUserId });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    await User.findByIdAndUpdate(targetUserId, {
      $set: {
        averageRating: avgRating,
        totalReviews: reviews.length,
      },
    });

    // Notify user about new review
    try {
      await NotificationService.notifyReviewReceived(targetUserId, reviewerId, rating, taskId);
    } catch (notifError) {
      console.error('Error sending review notification:', notifError);
    }

    // Populate and return
    await review.populate('reviewerId', 'name profileImage');
    await review.populate('targetUserId', 'name');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
const getUserReviews = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get reviews for the user with pagination
    const reviews = await Review.find({ targetUserId: userId })
      .populate('reviewerId', 'name profileImage role')
      .populate('taskId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ targetUserId: userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
        userStats: {
          name: user.name,
          profileImage: user.profileImage,
          averageRating: user.averageRating || 0,
          totalReviews: user.totalReviews || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews by a specific user
// @route   GET /api/reviews/my
const getMyReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ reviewerId: req.user._id })
      .populate('targetUserId', 'name profileImage role')
      .populate('taskId', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ reviewerId: req.user._id });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a specific task
// @route   GET /api/reviews/task/:taskId
const getTaskReviews = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const reviews = await Review.find({ taskId })
      .populate('reviewerId', 'name profileImage isAnonymous')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Only review author can update
    if (review.reviewerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      if (comment && comment.length > 500) {
        return res.status(400).json({ success: false, message: 'Comment cannot exceed 500 characters' });
      }
      review.comment = comment;
    }

    review.updatedAt = new Date();
    await review.save();

    // Update user stats
    const reviews = await Review.find({ targetUserId: review.targetUserId });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    await User.findByIdAndUpdate(review.targetUserId, {
      $set: {
        averageRating: avgRating,
        totalReviews: reviews.length,
      },
    });

    await review.populate('reviewerId', 'name profileImage');

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Only review author or admin can delete
    if (review.reviewerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    const targetUserId = review.targetUserId;
    await Review.findByIdAndDelete(reviewId);

    // Update user stats
    const reviews = await Review.find({ targetUserId });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    await User.findByIdAndUpdate(targetUserId, {
      $set: {
        averageRating: avgRating,
        totalReviews: reviews.length,
      },
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReviewValidation,
  getReviewValidation,
  createReview,
  getUserReviews,
  getMyReviews,
  getTaskReviews,
  updateReview,
  deleteReview,
};
