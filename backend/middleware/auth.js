const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized — user not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is verified
const requireVerified = (req, res, next) => {
  if (req.user.role === 'admin') return next(); // Admin is always verified
  if (req.user.verificationStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      message: 'Your account is not yet verified. Please wait for admin approval.',
    });
  }
  next();
};

module.exports = { protect, authorize, requireVerified };
