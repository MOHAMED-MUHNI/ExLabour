const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// GET notifications
router.get('/', notificationController.getUserNotifications);
router.get('/unread/count', notificationController.getUnreadCount);

// MARK AS READ
router.put('/:notificationId/read', notificationController.markAsRead);
router.put('/read/all', notificationController.markAllAsRead);

// DELETE
router.delete('/clear/old', notificationController.clearOldNotifications);
router.delete('/:notificationId', notificationController.deleteNotification);
router.delete('/delete/all', notificationController.deleteAllNotifications);

module.exports = router;
