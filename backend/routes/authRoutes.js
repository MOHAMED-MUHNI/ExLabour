const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const {
  register,
  login,
  refreshTokenFn,
  logout,
  getMe,
  updateProfile,
  registerValidation,
  loginValidation,
} = require('../controllers/authController');

router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/refresh', refreshTokenFn);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
