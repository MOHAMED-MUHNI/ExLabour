const express = require('express');
const router = express.Router();
const { protect, authorize, requireVerified } = require('../middleware/auth');
const {
  taskIdValidation,
  createTaskValidation,
  updateTaskValidation,
  createTask,
  getMyTasks,
  getAssignedTasks,
  getApprovedTasks,
  getTaskById,
  updateTask,
  cancelTask,
  deleteTask,
  getPendingTasks,
  approveTask,
  rejectTask,
} = require('../controllers/taskController');

// Public-ish routes (still need auth)
router.get('/approved', protect, getApprovedTasks);
router.get('/my', protect, authorize('user'), getMyTasks);
router.get('/assigned', protect, authorize('tasker'), getAssignedTasks);
router.get('/pending', protect, authorize('admin'), getPendingTasks);
router.get('/:id', protect, taskIdValidation, getTaskById);

// User routes (verified users only)
router.post('/', protect, authorize('user'), requireVerified, createTaskValidation, createTask);
router.put('/:id', protect, authorize('user'), requireVerified, taskIdValidation, updateTaskValidation, updateTask);
router.put('/:id/cancel', protect, authorize('user'), requireVerified, taskIdValidation, cancelTask);
router.delete('/:id', protect, taskIdValidation, deleteTask);

// Admin task approval
router.put('/:id/approve', protect, authorize('admin'), taskIdValidation, approveTask);
router.put('/:id/reject', protect, authorize('admin'), taskIdValidation, rejectTask);

module.exports = router;
