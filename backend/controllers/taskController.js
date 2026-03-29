const Task = require('../models/Task');
const Bid = require('../models/Bid');
const { deleteFromCloudinary } = require('../middleware/upload');
const { body, param, validationResult } = require('express-validator');

const TASK_CATEGORIES = [
  'cleaning', 'it-support', 'delivery', 'handyman',
  'tutoring', 'design', 'writing', 'moving',
  'gardening', 'cooking', 'photography', 'other',
];

const taskIdValidation = [
  param('id').isMongoId().withMessage('Invalid task ID'),
];

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Task description is required')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .isIn(TASK_CATEGORIES)
    .withMessage('Invalid task category'),
  body('budgetMin')
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a non-negative number'),
  body('budgetMax')
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a non-negative number')
    .custom((value, { req }) => Number(value) >= Number(req.body.budgetMin))
    .withMessage('Maximum budget must be greater than or equal to minimum budget'),
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      const deadlineDate = new Date(value);
      const now = new Date();
      if (deadlineDate <= now) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  body('location')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Location must be a string')
    .isLength({ max: 120 })
    .withMessage('Location cannot exceed 120 characters'),
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Attachments must be an array with up to 5 files'),
  body('attachments.*.url')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('Each attachment must include a valid URL'),
  body('attachments.*.key')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('Each attachment must include a storage key'),
  body('attachments.*.originalName')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Attachment original name cannot exceed 255 characters'),
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task description cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('category')
    .optional()
    .isIn(TASK_CATEGORIES)
    .withMessage('Invalid task category'),
  body('budgetMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a non-negative number'),
  body('budgetMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a non-negative number'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  body('location')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Location must be a string')
    .isLength({ max: 120 })
    .withMessage('Location cannot exceed 120 characters'),
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Attachments must be an array with up to 5 files'),
  body('attachments.*.url')
    .optional()
    .isURL({ require_protocol: true })
    .withMessage('Each attachment must include a valid URL'),
  body('attachments.*.key')
    .optional()
    .isString()
    .notEmpty()
    .withMessage('Each attachment must include a storage key'),
  body('attachments.*.originalName')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Attachment original name cannot exceed 255 characters'),
  body().custom((_, { req }) => {
    if (
      req.body.budgetMin !== undefined
      && req.body.budgetMax !== undefined
      && Number(req.body.budgetMax) < Number(req.body.budgetMin)
    ) {
      throw new Error('Maximum budget must be greater than or equal to minimum budget');
    }
    return true;
  }),
];

const sanitizeAttachments = (attachments) => {
  if (!Array.isArray(attachments)) return [];

  return attachments
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      url: item.url,
      key: item.key,
      originalName: item.originalName || '',
    }))
    .filter((item) => typeof item.url === 'string' && typeof item.key === 'string');
};

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, category, budgetMin, budgetMax, deadline, location, attachments } = req.body;

    const task = await Task.create({
      userId: req.user._id,
      title,
      description,
      category,
      budgetMin,
      budgetMax,
      deadline,
      location,
      attachments: sanitizeAttachments(attachments),
    });

    res.status(201).json({ success: true, message: 'Task created — pending admin approval', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my tasks (for task posters)
// @route   GET /api/tasks/my
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('assignedTaskerId', 'name email profileImage');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks assigned to logged-in tasker
// @route   GET /api/tasks/assigned
const getAssignedTasks = async (req, res, next) => {
  try {
    const { status } = req.query;
    const allowedStatuses = ['assigned', 'in_progress', 'completed', 'cancelled'];

    const filter = { assignedTaskerId: req.user._id };
    if (status && allowedStatuses.includes(status)) {
      filter.taskStatus = status;
    }

    const tasks = await Task.find(filter)
      .sort({ updatedAt: -1 })
      .populate('userId', 'name email profileImage');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all approved tasks (for taskers to browse)
// @route   GET /api/tasks/approved
const getApprovedTasks = async (req, res, next) => {
  try {
    const { category, minBudget, maxBudget, search, location, sort: sortOption } = req.query;

    const filter = {
      approvalStatus: 'approved',
      taskStatus: 'open_for_bidding',
    };

    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minBudget) filter.budgetMax = { $gte: Number(minBudget) };
    if (maxBudget) filter.budgetMin = { $lte: Number(maxBudget) };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    let sortBy = { createdAt: -1 };
    if (sortOption === 'budget_high') sortBy = { budgetMax: -1 };
    if (sortOption === 'budget_low') sortBy = { budgetMin: 1 };
    if (sortOption === 'deadline') sortBy = { deadline: 1 };

    const tasks = await Task.find(filter)
      .sort(sortBy)
      .populate('userId', 'name profileImage');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.id)
      .populate('userId', 'name email profileImage')
      .populate('assignedTaskerId', 'name email profileImage');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Get bids if the user is the task owner or admin
    let bids = [];
    if (req.user._id.toString() === task.userId._id.toString() || req.user.role === 'admin') {
      bids = await Bid.find({ taskId: task._id })
        .populate('taskerId', 'name email profileImage skills bio')
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, task, bids });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Only owner can update
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    // Cannot update after assignment
    if (task.taskStatus !== 'open_for_bidding' && task.approvalStatus !== 'pending_admin_approval') {
      return res.status(400).json({ success: false, message: 'Cannot update task after assignment' });
    }

    const allowedFields = ['title', 'description', 'category', 'budgetMin', 'budgetMax', 'deadline', 'location', 'attachments'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = field === 'attachments' ? sanitizeAttachments(req.body.attachments) : req.body[field];
      }
    });

    const nextBudgetMin = updates.budgetMin !== undefined ? Number(updates.budgetMin) : Number(task.budgetMin);
    const nextBudgetMax = updates.budgetMax !== undefined ? Number(updates.budgetMax) : Number(task.budgetMax);
    if (nextBudgetMax < nextBudgetMin) {
      return res.status(400).json({
        success: false,
        message: 'Maximum budget must be greater than or equal to minimum budget',
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    res.json({ success: true, message: 'Task updated', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel task
// @route   PUT /api/tasks/:id/cancel
const cancelTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this task' });
    }

    if (['completed', 'cancelled'].includes(task.taskStatus)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${task.taskStatus.replace('_', ' ')} task` });
    }

    task.taskStatus = 'cancelled';
    await task.save();

    await Bid.updateMany({ taskId: task._id, bidStatus: 'pending' }, { bidStatus: 'rejected' });

    res.json({ success: true, message: 'Task cancelled successfully', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Only owner can delete
    if (task.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    // Cannot delete after assignment
    if (['assigned', 'in_progress'].includes(task.taskStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot delete task after assignment' });
    }

    if (Array.isArray(task.attachments) && task.attachments.length > 0) {
      await Promise.all(task.attachments.map((attachment) => deleteFromCloudinary(attachment.key)));
    }

    // Delete associated bids
    await Bid.deleteMany({ taskId: task._id });
    await Task.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending tasks (Admin)
// @route   GET /api/tasks/pending
const getPendingTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ approvalStatus: 'pending_admin_approval' })
      .sort({ createdAt: 1 })
      .populate('userId', 'name email');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve task (Admin)
// @route   PUT /api/tasks/:id/approve
const approveTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.approvalStatus = 'approved';
    task.taskStatus = 'open_for_bidding';
    await task.save();

    res.json({ success: true, message: 'Task approved', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject task (Admin)
// @route   PUT /api/tasks/:id/reject
const rejectTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.approvalStatus = 'rejected';
    await task.save();

    res.json({ success: true, message: 'Task rejected', task });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
