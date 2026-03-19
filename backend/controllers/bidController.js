const Bid = require('../models/Bid');
const Task = require('../models/Task');
const { body, param, validationResult } = require('express-validator');

const bidIdValidation = [
  param('id').isMongoId().withMessage('Invalid bid ID'),
];

const bidTaskIdValidation = [
  param('taskId').isMongoId().withMessage('Invalid task ID'),
];

const placeBidValidation = [
  body('taskId')
    .isMongoId()
    .withMessage('Invalid task ID'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Bid amount must be a non-negative number'),
  body('deliveryDays')
    .isInt({ min: 1 })
    .withMessage('Delivery days must be at least 1'),
  body('proposalMessage')
    .trim()
    .notEmpty()
    .withMessage('Proposal message is required')
    .isLength({ max: 1000 })
    .withMessage('Proposal message cannot exceed 1000 characters'),
];

const updateBidValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bid amount must be a non-negative number'),
  body('deliveryDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Delivery days must be at least 1'),
  body('proposalMessage')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Proposal message cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Proposal message cannot exceed 1000 characters'),
  body().custom((_, { req }) => {
    const hasAtLeastOneField = ['amount', 'deliveryDays', 'proposalMessage']
      .some((field) => req.body[field] !== undefined);

    if (!hasAtLeastOneField) {
      throw new Error('Provide at least one field to update');
    }
    return true;
  }),
];

// @desc    Place a bid on a task
// @route   POST /api/bids
const placeBid = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { taskId, amount, deliveryDays, proposalMessage } = req.body;

    // Verify task exists and is open for bidding
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.approvalStatus !== 'approved') {
      return res.status(400).json({ success: false, message: 'Task is not approved yet' });
    }
    if (task.taskStatus !== 'open_for_bidding') {
      return res.status(400).json({ success: false, message: 'Task is no longer open for bidding' });
    }

    // Prevent task owner from bidding on own task
    if (task.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot bid on your own task' });
    }

    // Check if already bid on this task
    const existingBid = await Bid.findOne({ taskId, taskerId: req.user._id });
    if (existingBid) {
      return res.status(400).json({ success: false, message: 'You have already placed a bid on this task' });
    }

    const bid = await Bid.create({
      taskId,
      taskerId: req.user._id,
      amount,
      deliveryDays,
      proposalMessage,
    });

    // Increment bid count on task
    await Task.findByIdAndUpdate(taskId, { $inc: { bidCount: 1 } });

    res.status(201).json({ success: true, message: 'Bid placed successfully', bid });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bids for a specific task
// @route   GET /api/bids/task/:taskId
const getBidsForTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Only task owner or admin can see all bids
    if (task.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view bids for this task' });
    }

    const bids = await Bid.find({ taskId: req.params.taskId })
      .populate('taskerId', 'name email profileImage skills bio location')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bids.length, bids });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my bids (for taskers)
// @route   GET /api/bids/my
const getMyBids = async (req, res, next) => {
  try {
    const bids = await Bid.find({ taskerId: req.user._id })
      .populate('taskId', 'title category budgetMin budgetMax taskStatus deadline')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bids.length, bids });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a pending bid
// @route   PUT /api/bids/:id
const updateBid = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    if (bid.taskerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this bid' });
    }

    if (bid.bidStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only update pending bids' });
    }

    const task = await Task.findById(bid.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (task.approvalStatus !== 'approved' || task.taskStatus !== 'open_for_bidding') {
      return res.status(400).json({ success: false, message: 'Task is no longer open for bid updates' });
    }

    const updatableFields = ['amount', 'deliveryDays', 'proposalMessage'];
    const hasUpdates = updatableFields.some((field) => req.body[field] !== undefined);

    if (!hasUpdates) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    if (req.body.amount !== undefined) bid.amount = req.body.amount;
    if (req.body.deliveryDays !== undefined) bid.deliveryDays = req.body.deliveryDays;
    if (req.body.proposalMessage !== undefined) bid.proposalMessage = req.body.proposalMessage;

    await bid.save();

    res.json({ success: true, message: 'Bid updated successfully', bid });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw a bid
// @route   PUT /api/bids/:id/withdraw
const withdrawBid = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const bid = await Bid.findById(req.params.id);
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    if (bid.taskerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to withdraw this bid' });
    }

    if (bid.bidStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only withdraw pending bids' });
    }

    bid.bidStatus = 'withdrawn';
    await bid.save();

    // Decrement bid count
    await Task.findByIdAndUpdate(bid.taskId, { $inc: { bidCount: -1 } });

    res.json({ success: true, message: 'Bid withdrawn', bid });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a bid (task owner)
// @route   PUT /api/bids/:id/accept
const acceptBid = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const bid = await Bid.findById(req.params.id).populate('taskId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    const task = await Task.findById(bid.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Only task owner can accept bids
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the task owner can accept bids' });
    }

    if (task.taskStatus !== 'open_for_bidding') {
      return res.status(400).json({ success: false, message: 'Task is no longer open for bidding' });
    }

    if (bid.bidStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only accept pending bids' });
    }

    // Accept this bid
    bid.bidStatus = 'accepted';
    await bid.save();

    // Reject all other pending bids for this task
    await Bid.updateMany(
      { taskId: task._id, _id: { $ne: bid._id }, bidStatus: 'pending' },
      { bidStatus: 'rejected' }
    );

    // Update task: assign tasker and change status
    task.assignedTaskerId = bid.taskerId;
    task.assignedBidId = bid._id;
    task.taskStatus = 'assigned';
    await task.save();

    res.json({
      success: true,
      message: 'Bid accepted — tasker has been assigned',
      bid,
      task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark task as in-progress
// @route   PUT /api/bids/task/:taskId/start
const markInProgress = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Only assigned tasker can start
    if (task.assignedTaskerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned tasker can start this task' });
    }

    if (task.taskStatus !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Task must be in assigned state to start' });
    }

    task.taskStatus = 'in_progress';
    await task.save();

    res.json({ success: true, message: 'Task marked as in progress', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark task as completed
// @route   PUT /api/bids/task/:taskId/complete
const markCompleted = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Task owner or assigned tasker can mark complete
    const isOwner = task.userId.toString() === req.user._id.toString();
    const isAssignedTasker = task.assignedTaskerId && task.assignedTaskerId.toString() === req.user._id.toString();
    
    if (!isOwner && !isAssignedTasker) {
      return res.status(403).json({ success: false, message: 'Not authorized to complete this task' });
    }

    if (task.taskStatus !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Task must be in progress to complete' });
    }

    task.taskStatus = 'completed';
    await task.save();

    res.json({ success: true, message: 'Task marked as completed', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a bid manually (task owner only)
// @route   PUT /api/bids/:id/reject
const rejectBid = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const bid = await Bid.findById(req.params.id).populate('taskId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    const task = await Task.findById(bid.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // Only task owner can reject bids
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the task owner can reject bids' });
    }

    if (bid.bidStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only reject pending bids' });
    }

    bid.bidStatus = 'rejected';
    await bid.save();

    res.json({ success: true, message: 'Bid rejected successfully', bid });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin moderate a bid (approve or reject)
// @route   PUT /api/bids/:id/admin-review
const adminReviewBid = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { action } = req.body;
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject"' });
    }

    const bid = await Bid.findById(req.params.id).populate('taskId');
    if (!bid) return res.status(404).json({ success: false, message: 'Bid not found' });

    if (bid.bidStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only moderate pending bids' });
    }

    const task = await Task.findById(bid.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    bid.bidStatus = action === 'approve' ? 'accepted' : 'rejected';
    await bid.save();

    if (action === 'approve') {
      // If admin approves, assign tasker and auto-reject other pending bids
      await Bid.updateMany(
        { taskId: task._id, _id: { $ne: bid._id }, bidStatus: 'pending' },
        { bidStatus: 'rejected' }
      );
      task.assignedTaskerId = bid.taskerId;
      task.assignedBidId = bid._id;
      task.taskStatus = 'assigned';
      await task.save();
    }

    res.json({
      success: true,
      message: `Bid ${action === 'approve' ? 'approved and tasker assigned' : 'rejected'} by admin`,
      bid,
      ...(action === 'approve' && { task })
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bidIdValidation,
  bidTaskIdValidation,
  placeBidValidation,
  updateBidValidation,
  placeBid,
  getBidsForTask,
  getMyBids,
  updateBid,
  withdrawBid,
  acceptBid,
  rejectBid,
  adminReviewBid,
  markInProgress,
  markCompleted,
};
