const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createReviewValidation,
  getReviewValidation,
  createReview,
  getUserReviews,
  getMyReviews,
  getTaskReviews,
  updateReview,
  deleteReview,
} = require('../controllers/reviewController');

// Create review (protected)
router.post('/task/:taskId', protect, createReviewValidation, createReview);

// Get reviews for a user
router.get('/user/:userId', getReviewValidation, getUserReviews);

// Get my reviews
router.get('/my', protect, getMyReviews);

// Get reviews for a task
router.get('/task/:taskId', getTaskReviews);

// Update a review
router.put('/:reviewId', protect, updateReview);

// Delete a review
router.delete('/:reviewId', protect, deleteReview);

module.exports = router;
