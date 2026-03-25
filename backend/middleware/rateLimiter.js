const rateLimit = require('express-rate-limit');

/**
 * Rate limiters for authentication endpoints
 * Protects against brute-force attacks
 */

// Strict rate limiter for login attempts
// Max 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  statusCode: 429,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Don't rate limit if NODE_ENV is development (for testing)
    return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
  },
});

// Moderate rate limiter for registration
// Max 3 attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many account creation attempts. Please try again after 1 hour.',
  },
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true';
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
};
