const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema({
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Target ID is required'],
  },
  targetType: {
    type: String,
    enum: ['user', 'tasker'],
    required: [true, 'Target type is required'],
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer ID is required'],
  },
  decision: {
    type: String,
    enum: ['verified', 'rejected', 'blocked', 'unblocked'],
    required: [true, 'Decision is required'],
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
    default: '',
  },
}, {
  timestamps: true,
});

verificationLogSchema.index({ targetId: 1 });

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
