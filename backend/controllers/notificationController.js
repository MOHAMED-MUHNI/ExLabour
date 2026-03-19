const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// @desc    Get all notifications for current user (paginated)
// @route   GET /api/notifications
// @access  Private
exports.getUserNotifications = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all'; // 'all', 'unread', 'read'

    // Build filter
    const query = { recipientId: req.user.id };
    if (filter === 'unread') query.isRead = false;
    if (filter === 'read') query.isRead = true;

    // Get total count
    const total = await Notification.countDocuments(query);

    // Get paginated notifications
    const notifications = await Notification.find(query)
      .populate('senderId', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread/count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message,
    });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:notificationId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Verify ownership
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification',
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read/all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      error: error.message,
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Verify ownership
    if (notification.recipientId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification',
      });
    }

    await Notification.deleteOne({ _id: req.params.notificationId });

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications/delete/all
// @access  Private
exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipientId: req.user.id });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notifications',
      error: error.message,
    });
  }
};

// @desc    Clear read notifications older than 30 days
// @route   DELETE /api/notifications/clear/old
// @access  Private
exports.clearOldNotifications = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Notification.deleteMany({
      recipientId: req.user.id,
      isRead: true,
      createdAt: { $lt: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      message: 'Old read notifications cleared',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications',
      error: error.message,
    });
  }
};
