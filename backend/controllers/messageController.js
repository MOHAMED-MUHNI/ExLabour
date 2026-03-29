const Message = require('../models/Message');
const Task = require('../models/Task');
const { body, param, validationResult } = require('express-validator');

const sendMessageValidation = [
  body('content').trim().notEmpty().withMessage('Message cannot be empty').isLength({ max: 2000 }),
];

// @desc    Send a message in a task conversation
// @route   POST /api/messages/:taskId
const sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isOwner = task.userId.toString() === req.user._id.toString();
    const isAssignedTasker =
      task.assignedTaskerId && task.assignedTaskerId.toString() === req.user._id.toString();

    if (!isOwner && !isAssignedTasker) {
      return res.status(403).json({ success: false, message: 'Only the task owner and assigned tasker can message each other' });
    }

    if (!task.assignedTaskerId) {
      return res.status(400).json({ success: false, message: 'No tasker is assigned to this task yet' });
    }

    const receiverId = isOwner ? task.assignedTaskerId : task.userId;

    const message = await Message.create({
      taskId: task._id,
      senderId: req.user._id,
      receiverId,
      content: req.body.content,
    });

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name profileImage')
      .populate('receiverId', 'name profileImage');

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages for a task conversation
// @route   GET /api/messages/:taskId
const getMessages = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isOwner = task.userId.toString() === req.user._id.toString();
    const isAssignedTasker =
      task.assignedTaskerId && task.assignedTaskerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedTasker && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ taskId: task._id })
      .populate('senderId', 'name profileImage')
      .sort({ createdAt: 1 });

    // Mark unread messages as read for the current user
    await Message.updateMany(
      { taskId: task._id, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread message count for current user
// @route   GET /api/messages/unread/count
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ receiverId: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  sendMessageValidation,
  getMessages,
  getUnreadCount,
};
