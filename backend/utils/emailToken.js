const crypto = require('crypto');

/**
 * Generate an email verification token with expiration
 * Token is a random string, expiration is 24 hours from now
 * @returns {Object} { token, expiresAt }
 */
const generateEmailToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { token, expiresAt };
};

/**
 * Verify an email token
 * Checks if token exists and hasn't expired
 * @param {String} token - The token to verify
 * @param {Date} expiresAt - The expiration date from database
 * @returns {Object} { valid: boolean, message: string }
 */
const verifyEmailToken = (token, expiresAt) => {
  if (!token) {
    return { valid: false, message: 'Verification token is missing' };
  }

  if (!expiresAt) {
    return { valid: false, message: 'Token expiration date is missing' };
  }

  // Check if token has expired
  if (new Date() > expiresAt) {
    return { valid: false, message: 'Verification token has expired' };
  }

  return { valid: true, message: 'Token is valid' };
};

module.exports = {
  generateEmailToken,
  verifyEmailToken,
};
