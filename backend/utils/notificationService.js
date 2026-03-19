const Notification = require('../models/Notification');

/**
 * Notification Service
 * Helper functions to create notifications throughout the app
 */

class NotificationService {
  /**
   * Create a notification
   * @param {Object} data - Notification data
   * @returns {Promise} Created notification
   */
  static async create(data) {
    try {
      const notification = await Notification.createNotification(data);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notify when a bid is placed on a task
   * @param {ObjectId} taskOwnerId - ID of task owner
   * @param {ObjectId} bidderId - ID of person placing bid
   * @param {ObjectId} taskId - ID of task
   * @param {Number} bidAmount - Bid amount
   */
  static async notifyBidPlaced(taskOwnerId, bidderId, taskId, bidAmount) {
    await this.create({
      recipientId: taskOwnerId,
      senderId: bidderId,
      type: 'bid_placed',
      title: 'New Bid Received',
      message: `You received a new bid of $${bidAmount.toFixed(2)}`,
      taskId,
      actionUrl: `/dashboard/tasks/${taskId}`,
      icon: 'bid',
    });
  }

  /**
   * Notify when a bid is accepted
   * @param {ObjectId} bidderId - ID of person whose bid was accepted
   * @param {ObjectId} taskId - ID of task
   */
  static async notifyBidAccepted(bidderId, taskId) {
    await this.create({
      recipientId: bidderId,
      type: 'bid_accepted',
      title: 'Bid Accepted',
      message: 'Your bid has been accepted! Task assigned to you.',
      taskId,
      actionUrl: `/dashboard/assigned-tasks/${taskId}`,
      icon: 'success',
    });
  }

  /**
   * Notify when a bid is rejected
   * @param {ObjectId} bidderId - ID of person whose bid was rejected
   * @param {ObjectId} taskId - ID of task
   */
  static async notifyBidRejected(bidderId, taskId) {
    await this.create({
      recipientId: bidderId,
      type: 'bid_rejected',
      title: 'Bid Not Selected',
      message: 'Your bid was not selected for this task.',
      taskId,
      actionUrl: `/tasks/${taskId}`,
      icon: 'info',
    });
  }

  /**
   * Notify when a bid is withdrawn
   * @param {ObjectId} taskOwnerId - ID of task owner
   * @param {ObjectId} bidderId - ID of person withdrawing bid
   * @param {ObjectId} taskId - ID of task
   */
  static async notifyBidWithdrawn(taskOwnerId, bidderId, taskId) {
    await this.create({
      recipientId: taskOwnerId,
      senderId: bidderId,
      type: 'bid_withdrawn',
      title: 'Bid Withdrawn',
      message: 'A bidder has withdrawn their bid for your task.',
      taskId,
      actionUrl: `/dashboard/tasks/${taskId}`,
      icon: 'warning',
    });
  }

  /**
   * Notify when a task is assigned
   * @param {ObjectId} taskerId - ID of tasker assigned to task
   * @param {ObjectId} taskId - ID of task
   * @param {ObjectId} taskOwnerId - ID of task owner
   */
  static async notifyTaskAssigned(taskerId, taskId, taskOwnerId) {
    // Notify tasker
    await this.create({
      recipientId: taskerId,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: 'You have been assigned to a new task.',
      taskId,
      actionUrl: `/dashboard/assigned-tasks/${taskId}`,
      icon: 'task',
    });

    // Notify task owner
    await this.create({
      recipientId: taskOwnerId,
      type: 'task_assigned',
      title: 'Tasker Assigned',
      message: 'A tasker has been assigned to your task.',
      taskId,
      actionUrl: `/dashboard/tasks/${taskId}`,
      icon: 'task',
    });
  }

  /**
   * Notify when a task is completed
   * @param {ObjectId} taskOwnerId - ID of task owner
   * @param {ObjectId} taskerId - ID of tasker who completed it
   * @param {ObjectId} taskId - ID of task
   */
  static async notifyTaskCompleted(taskOwnerId, taskerId, taskId) {
    await this.create({
      recipientId: taskOwnerId,
      senderId: taskerId,
      type: 'task_completed',
      title: 'Task Completed',
      message: 'Your task has been marked as completed.',
      taskId,
      actionUrl: `/dashboard/tasks/${taskId}`,
      icon: 'success',
    });
  }

  /**
   * Notify when a task is cancelled
   * @param {ObjectId} taskerId - ID of tasker assigned to cancelled task
   * @param {ObjectId} taskId - ID of task
   */
  static async notifyTaskCancelled(taskerId, taskId) {
    await this.create({
      recipientId: taskerId,
      type: 'task_cancelled',
      title: 'Task Cancelled',
      message: 'A task you were assigned to has been cancelled.',
      taskId,
      actionUrl: `/dashboard`,
      icon: 'warning',
    });
  }

  /**
   * Notify when a review is received
   * @param {ObjectId} revieweeId - ID of person being reviewed
   * @param {ObjectId} reviewerId - ID of person leaving review
   * @param {Number} rating - Star rating
   * @param {ObjectId} taskId - ID of task
   */
  static async notifyReviewReceived(revieweeId, reviewerId, rating, taskId) {
    await this.create({
      recipientId: revieweeId,
      senderId: reviewerId,
      type: 'review_received',
      title: `${rating}-Star Review Received`,
      message: `You received a ${rating}-star review from a user.`,
      taskId,
      actionUrl: `/dashboard/profile`,
      icon: 'review',
    });
  }

  /**
   * Notify when user is verified
   * @param {ObjectId} userId - ID of user verified
   */
  static async notifyUserVerified(userId) {
    await this.create({
      recipientId: userId,
      type: 'user_verified',
      title: 'Account Verified',
      message: 'Your account has been verified by the admin.',
      actionUrl: `/dashboard/profile`,
      icon: 'verification',
    });
  }

  /**
   * Notify when user verification is rejected
   * @param {ObjectId} userId - ID of user
   * @param {String} reason - Reason for rejection
   */
  static async notifyUserRejected(userId, reason) {
    await this.create({
      recipientId: userId,
      type: 'user_rejected',
      title: 'Verification Rejected',
      message: `Your verification was rejected. ${reason || 'Please try again.'}`,
      actionUrl: `/dashboard/profile`,
      icon: 'error',
    });
  }

  /**
   * Notify admin about something
   * @param {ObjectId} adminId - ID of admin
   * @param {String} title - Notification title
   * @param {String} message - Notification message
   * @param {String} type - Notification type
   */
  static async notifyAdmin(adminId, title, message, type = 'system_alert') {
    await this.create({
      recipientId: adminId,
      type,
      title,
      message,
      actionUrl: `/admin`,
      icon: 'info',
    });
  }

  /**
   * Get unread count for a user
   * @param {ObjectId} userId - User ID
   * @returns {Promise<Number>} Unread notification count
   */
  static async getUnreadCount(userId) {
    return await Notification.getUnreadCount(userId);
  }
}

module.exports = NotificationService;
