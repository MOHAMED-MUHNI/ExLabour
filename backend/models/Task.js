const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task must belong to a user'],
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'cleaning', 'it-support', 'delivery', 'handyman',
      'tutoring', 'design', 'writing', 'moving',
      'gardening', 'cooking', 'photography', 'other',
    ],
  },
  budgetMin: {
    type: Number,
    required: [true, 'Minimum budget is required'],
    min: [0, 'Budget cannot be negative'],
  },
  budgetMax: {
    type: Number,
    required: [true, 'Maximum budget is required'],
    validate: {
      validator: function (val) {
        return val >= this.budgetMin;
      },
      message: 'Maximum budget must be greater than or equal to minimum budget',
    },
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  location: {
    type: String,
    default: '',
  },
  attachments: [{
    url: String,
    key: String,
    originalName: String,
  }],
  approvalStatus: {
    type: String,
    enum: ['pending_admin_approval', 'approved', 'rejected'],
    default: 'pending_admin_approval',
  },
  taskStatus: {
    type: String,
    enum: ['open_for_bidding', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'open_for_bidding',
  },
  assignedTaskerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedBidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bid',
    default: null,
  },
  bidCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
taskSchema.index({ approvalStatus: 1, taskStatus: 1 });
taskSchema.index({ userId: 1 });
taskSchema.index({ category: 1 });

module.exports = mongoose.model('Task', taskSchema);
