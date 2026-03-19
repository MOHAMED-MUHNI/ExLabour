const express = require('express');
const router = express.Router();
const { protect, authorize, requireVerified } = require('../middleware/auth');
const {
  bidIdValidation,
  bidTaskIdValidation,
  placeBidValidation,
  updateBidValidation,
  placeBid,
  getBidsForTask,
  getMyBids,
  updateBid,
  withdrawBid,
  acceptBid,
  rejectBid,
  adminReviewBid,
  markInProgress,
  markCompleted,
} = require('../controllers/bidController');

// Tasker routes
router.post('/', protect, authorize('tasker'), requireVerified, placeBidValidation, placeBid);
router.get('/my', protect, authorize('tasker'), getMyBids);
router.put('/:id', protect, authorize('tasker'), requireVerified, bidIdValidation, updateBidValidation, updateBid);
router.put('/:id/withdraw', protect, authorize('tasker'), bidIdValidation, withdrawBid);

// Task owner routes
router.get('/task/:taskId', protect, bidTaskIdValidation, getBidsForTask);
router.put('/:id/accept', protect, authorize('user'), requireVerified, bidIdValidation, acceptBid);
router.put('/:id/reject', protect, authorize('user'), requireVerified, bidIdValidation, rejectBid);

// Admin routes
router.put('/:id/admin-review', protect, authorize('admin'), bidIdValidation, adminReviewBid);

// Task lifecycle
router.put('/task/:taskId/start', protect, authorize('tasker'), bidTaskIdValidation, markInProgress);
router.put('/task/:taskId/complete', protect, bidTaskIdValidation, markCompleted);

module.exports = router;
