const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

/**
 * Generate access token (short-lived, 15 minutes)
 * @param {ObjectId} userId - User ID
 * @returns {String} JWT access token
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
  });
};

/**
 * Generate refresh token (long-lived, 7 days)
 * Stores token in database for validation
 * @param {ObjectId} userId - User ID
 * @returns {Promise<String>} JWT refresh token
 */
const generateRefreshToken = async (userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  try {
    await RefreshToken.create({
      token,
      userId,
      expiresAt,
    });
  } catch (error) {
    console.error('Error saving refresh token:', error);
  }

  return token;
};

/**
 * Generate both tokens (for login/register)
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} { accessToken, refreshToken }
 */
const generateTokens = async (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = await generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  // Keep main export for backwards compatibility
  default: generateAccessToken,
};

// Support old-style import: const generateToken = require(...)
module.exports.default = generateAccessToken;
