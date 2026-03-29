const Report = require('../models/Report');
const { body, validationResult } = require('express-validator');

const createReportValidation = [
  body('reason')
    .isIn(['spam', 'fraud', 'harassment', 'inappropriate_content', 'payment_dispute', 'other'])
    .withMessage('Invalid reason'),
  body('details').optional().trim().isLength({ max: 1000 }).withMessage('Details cannot exceed 1000 characters'),
];

// @desc    Create a report/dispute
// @route   POST /api/reports
const createReport = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { targetUserId, taskId, reason, details } = req.body;

    // Don't allow self-reporting
    if (targetUserId && targetUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      targetUserId,
      taskId,
      reason,
      details,
    });

    res.status(201).json({ success: true, message: 'Report submitted. Our team will review it.', report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my submitted reports
// @route   GET /api/reports/my
const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .populate('targetUserId', 'name email')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports
const getAllReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const reports = await Report.find(filter)
      .populate('reporterId', 'name email')
      .populate('targetUserId', 'name email')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status (Admin)
// @route   PUT /api/reports/:id
const updateReport = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const allowed = ['open', 'under_review', 'resolved', 'dismissed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        ...(status === 'resolved' || status === 'dismissed'
          ? { resolvedBy: req.user._id, resolvedAt: new Date() }
          : {}),
      },
      { new: true }
    );

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, createReportValidation, getMyReports, getAllReports, updateReport };
