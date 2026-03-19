const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPendingUsers,
  getAllUsers,
  verifyUser,
  rejectUser,
  blockUser,
  unblockUser,
  getAllBids,
  getDashboardMetrics,
  getVerificationLogs,
} = require('../controllers/adminController');

// All routes require admin role
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardMetrics);
router.get('/pending', getPendingUsers);
router.get('/users', getAllUsers);
router.get('/bids', getAllBids);
router.get('/logs', getVerificationLogs);
router.put('/verify/:id', verifyUser);
router.put('/reject/:id', rejectUser);
router.put('/block/:id', blockUser);
router.put('/unblock/:id', unblockUser);

module.exports = router;
