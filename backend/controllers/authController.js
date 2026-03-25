const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateTokens } = require('../utils/generateToken');
const { generateEmailToken, verifyEmailToken } = require('../utils/emailToken');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');
const { body, validationResult } = require('express-validator');

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['user', 'tasker']).withMessage('Role must be user or tasker'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// @desc    Register user/tasker
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role, phone, bio, skills, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Generate email verification token
    const { token: emailToken, expiresAt: emailTokenExpires } = generateEmailToken();

    // Create user with email verification fields
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      phone,
      bio,
      skills: role === 'tasker' ? skills : [],
      location,
      emailVerified: false,
      emailVerificationToken: emailToken,
      emailVerificationExpires: emailTokenExpires,
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, emailToken, name);
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Continue with registration even if email fails, but log the error
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      requiresEmailVerification: true,
      email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in',
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user._id);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
const refreshTokenFn = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Verify refresh token exists in database
    const storedToken = await RefreshToken.findOne({ token });
    if (!storedToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(401).json({ success: false, message: 'Refresh token has expired' });
    }

    // Verify user still exists and is active
    const user = await User.findById(storedToken.userId);
    if (!user || !user.isActive) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(401).json({ success: false, message: 'User account is not available' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed',
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (clear refresh token)
// @route   POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      await RefreshToken.deleteOne({ token });
    }

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    // Find user with matching verification token
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid verification token' });
    }

    // Verify token validity
    const tokenCheck = verifyEmailToken(user.emailVerificationToken, user.emailVerificationExpires);
    if (!tokenCheck.valid) {
      return res.status(400).json({ success: false, message: tokenCheck.message });
    }

    // Mark email as verified and clear token fields
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send welcome email
    const emailResult = await sendWelcomeEmail(user.email, user.name);
    if (!emailResult.success) {
      console.error('Failed to send welcome email:', emailResult.error);
    }

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification-email
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }

    // Generate new verification token
    const { token: emailToken, expiresAt: emailTokenExpires } = generateEmailToken();
    user.emailVerificationToken = emailToken;
    user.emailVerificationExpires = emailTokenExpires;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, emailToken, user.name);
    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: 'Failed to send verification email', error: emailResult.error });
    }

    res.json({
      success: true,
      message: 'Verification email resent. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'bio', 'skills', 'location'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshTokenFn,
  logout,
  verifyEmail,
  resendVerificationEmail,
  getMe,
  updateProfile,
  registerValidation,
  loginValidation,
};
