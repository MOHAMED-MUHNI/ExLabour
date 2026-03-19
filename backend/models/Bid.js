const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required'],
  },
  taskerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Tasker ID is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount cannot be negative'],
  },
  deliveryDays: {
    type: Number,
    required: [true, 'Delivery days is required'],
    min: [1, 'Delivery must be at least 1 day'],
  },
  proposalMessage: {
    type: String,
    required: [true, 'Proposal message is required'],
    maxlength: [1000, 'Proposal cannot exceed 1000 characters'],
  },
  bidStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Prevent duplicate bids: one bid per tasker per task
bidSchema.index({ taskId: 1, taskerId: 1 }, { unique: true });
bidSchema.index({ taskId: 1 });
bidSchema.index({ taskerId: 1 });

module.exports = mongoose.model('Bid', bidSchema);
