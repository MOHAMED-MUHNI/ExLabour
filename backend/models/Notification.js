const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system notifications
    },
    type: {
      type: String,
      enum: [
        'bid_placed',
        'bid_accepted',
        'bid_rejected',
        'bid_withdrawn',
        'task_assigned',
        'task_completed',
        'task_cancelled',
        'review_received',
        'user_verified',
        'user_rejected',
        'payment_received',
        'payment_pending',
        'message_received',
        'system_alert',
      ],
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
      default: null,
    },
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      default: null,
    },
    actionUrl: {
      type: String,
      default: null, // e.g., "/dashboard/tasks/123" or "/dashboard/bids/123"
    },
    icon: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'bid', 'task', 'review', 'verification'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    indexes: [
      { recipientId: 1, isRead: 1 }, // For fetching unread notifications
      { recipientId: 1, createdAt: -1 }, // For pagination
    ],
  }
);

// Mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Statics for common queries
notificationSchema.statics.createNotification = async function (data) {
  const notification = await this.create({
    recipientId: data.recipientId,
    senderId: data.senderId || null,
    type: data.type,
    title: data.title,
    message: data.message,
    taskId: data.taskId || null,
    bidId: data.bidId || null,
    reviewId: data.reviewId || null,
    actionUrl: data.actionUrl || null,
    icon: data.icon || 'info',
  });
  return notification;
};

// Get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ recipientId: userId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);
