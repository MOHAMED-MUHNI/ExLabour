const User = require('../models/User');
const VerificationLog = require('../models/VerificationLog');
const Task = require('../models/Task');
const Bid = require('../models/Bid');

// @desc    Get pending users/taskers for verification
// @route   GET /api/admin/pending
const getPendingUsers = async (req, res, next) => {
  try {
    const { type } = req.query; // 'user', 'tasker', or all
    const filter = { verificationStatus: 'pending' };
    if (type) filter.role = type;

    const users = await User.find(filter).sort({ createdAt: 1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (with optional filters)
// @route   GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const filter = { role: { $ne: 'admin' } };
    if (role) filter.role = role;
    if (status) filter.verificationStatus = status;

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a user/tasker
// @route   PUT /api/admin/verify/:id
const verifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot modify admin accounts' });

    user.verificationStatus = 'verified';
    await user.save();

    await VerificationLog.create({
      targetId: user._id,
      targetType: user.role,
      reviewedBy: req.user._id,
      decision: 'verified',
      remarks: req.body.remarks || '',
    });

    res.json({ success: true, message: `${user.name} has been verified`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a user/tasker
// @route   PUT /api/admin/reject/:id
const rejectUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot modify admin accounts' });

    user.verificationStatus = 'rejected';
    await user.save();

    await VerificationLog.create({
      targetId: user._id,
      targetType: user.role,
      reviewedBy: req.user._id,
      decision: 'rejected',
      remarks: req.body.remarks || '',
    });

    res.json({ success: true, message: `${user.name} has been rejected`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Block a user/tasker
// @route   PUT /api/admin/block/:id
const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot modify admin accounts' });

    user.verificationStatus = 'blocked';
    user.isActive = false;
    await user.save();

    await VerificationLog.create({
      targetId: user._id,
      targetType: user.role,
      reviewedBy: req.user._id,
      decision: 'blocked',
      remarks: req.body.remarks || '',
    });

    res.json({ success: true, message: `${user.name} has been blocked`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock a user/tasker
// @route   PUT /api/admin/unblock/:id
const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.verificationStatus = 'verified';
    user.isActive = true;
    await user.save();

    await VerificationLog.create({
      targetId: user._id,
      targetType: user.role,
      reviewedBy: req.user._id,
      decision: 'unblocked',
      remarks: req.body.remarks || '',
    });

    res.json({ success: true, message: `${user.name} has been unblocked`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bids (with optional filters)
// @route   GET /api/admin/bids
const getAllBids = async (req, res, next) => {
  try {
    const { status, taskStatus, search } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.bidStatus = status;
    if (search) {
      filter.proposalMessage = { $regex: search, $options: 'i' };
    }

    let bids = await Bid.find(filter)
      .sort({ createdAt: -1 })
      .populate({
        path: 'taskId',
        select: 'title category taskStatus approvalStatus deadline budgetMin budgetMax userId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('taskerId', 'name email profileImage');

    // Exclude orphaned bids where task/tasker has been removed
    bids = bids.filter((bid) => bid.taskId && bid.taskerId);

    if (taskStatus && taskStatus !== 'all') {
      bids = bids.filter((bid) => bid.taskId.taskStatus === taskStatus);
    }

    const summary = {
      total: bids.length,
      pending: bids.filter((bid) => bid.bidStatus === 'pending').length,
      accepted: bids.filter((bid) => bid.bidStatus === 'accepted').length,
      rejected: bids.filter((bid) => bid.bidStatus === 'rejected').length,
      withdrawn: bids.filter((bid) => bid.bidStatus === 'withdrawn').length,
    };

    res.json({ success: true, count: bids.length, summary, bids });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard metrics
// @route   GET /api/admin/dashboard
const getDashboardMetrics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTaskers,
      pendingVerifications,
      totalTasks,
      pendingTasks,
      activeTasks,
      completedTasks,
      totalBids,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'tasker' }),
      User.countDocuments({ verificationStatus: 'pending' }),
      Task.countDocuments(),
      Task.countDocuments({ approvalStatus: 'pending_admin_approval' }),
      Task.countDocuments({ taskStatus: { $in: ['open_for_bidding', 'assigned', 'in_progress'] } }),
      Task.countDocuments({ taskStatus: 'completed' }),
      Bid.countDocuments(),
    ]);

    // Recent activity
    const recentUsers = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role verificationStatus createdAt');

    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email')
      .select('title category approvalStatus taskStatus budgetMin budgetMax createdAt');

    res.json({
      success: true,
      metrics: {
        users: { total: totalUsers, taskers: totalTaskers, pendingVerifications },
        tasks: { total: totalTasks, pending: pendingTasks, active: activeTasks, completed: completedTasks },
        bids: { total: totalBids },
      },
      recent: { users: recentUsers, tasks: recentTasks },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get verification logs
// @route   GET /api/admin/logs
const getVerificationLogs = async (req, res, next) => {
  try {
    const logs = await VerificationLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('targetId', 'name email role')
      .populate('reviewedBy', 'name email');

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingUsers,
  getAllUsers,
  verifyUser,
  rejectUser,
  blockUser,
  unblockUser,
  getAllBids,
  getDashboardMetrics,
  getVerificationLogs,
};
