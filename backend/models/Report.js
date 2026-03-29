const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    reason: {
      type: String,
      enum: ['spam', 'fraud', 'harassment', 'inappropriate_content', 'payment_dispute', 'other'],
      required: true,
    },
    details: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1 });

module.exports = mongoose.model('Report', ReportSchema);
