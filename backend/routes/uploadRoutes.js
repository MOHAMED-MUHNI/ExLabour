const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadToS3 } = require('../middleware/upload');
const User = require('../models/User');

// @desc    Upload profile image
// @route   POST /api/upload/profile-image
router.post('/profile-image', protect, (req, res, next) => {
  req.uploadType = 'profile';
  next();
}, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const result = await uploadToS3(req.file, 'profiles');

    // Update user's profile image
    await User.findByIdAndUpdate(req.user._id, { profileImage: result.url });

    res.json({
      success: true,
      message: 'Profile image uploaded',
      data: { url: result.url, key: result.key },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload task attachment
// @route   POST /api/upload/task-attachment
router.post('/task-attachment', protect, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const result = await uploadToS3(req.file, 'attachments');

    res.json({
      success: true,
      message: 'File uploaded',
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload verification document (tasker)
// @route   POST /api/upload/verification-document
router.post('/verification-document', protect, authorize('tasker'), (req, res, next) => {
  req.uploadType = 'verification';
  next();
}, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if ((user.verificationDocuments || []).length >= 5) {
      return res.status(400).json({ success: false, message: 'Maximum 5 verification documents allowed' });
    }

    const result = await uploadToS3(req.file, 'verification-docs');

    user.verificationDocuments.push({
      url: result.url,
      key: result.key,
      originalName: result.originalName,
      uploadedAt: new Date(),
    });

    // Re-submission by rejected taskers should move them back to pending review.
    if (user.verificationStatus === 'rejected') {
      user.verificationStatus = 'pending';
    }

    await user.save();

    res.json({
      success: true,
      message: 'Verification document uploaded',
      data: result,
      user,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
