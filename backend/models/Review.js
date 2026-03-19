const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Review must belong to a task'],
    index: true,
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer ID is required'],
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Target user ID is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  reviewType: {
    type: String,
    enum: ['task_owner_to_tasker', 'tasker_to_owner'],
    required: [true, 'Review type is required'],
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index: one review per reviewer per task
reviewSchema.index({ taskId: 1, reviewerId: 1 }, { unique: true });

// Index for fetching reviews of a user
reviewSchema.index({ targetUserId: 1, createdAt: -1 });

// Index for task reviews
reviewSchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
