const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { sendMessage, sendMessageValidation, getMessages, getUnreadCount } = require('../controllers/messageController');

router.get('/unread/count', protect, getUnreadCount);
router.get('/:taskId', protect, getMessages);
router.post('/:taskId', protect, sendMessageValidation, sendMessage);

module.exports = router;
