const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createReport,
  createReportValidation,
  getMyReports,
  getAllReports,
  updateReport,
} = require('../controllers/reportController');

router.post('/', protect, createReportValidation, createReport);
router.get('/my', protect, getMyReports);
router.get('/', protect, authorize('admin'), getAllReports);
router.put('/:id', protect, authorize('admin'), updateReport);

module.exports = router;
