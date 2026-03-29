const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const path = require('path');
const { Readable } = require('stream');

// Multer memory storage (files buffered, then uploaded to Cloudinary)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (req.uploadType === 'profile') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed for profile pictures'), false);
    }
  } else {
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and PDF files are allowed'), false);
    }
  }
};

// Multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Upload file to Cloudinary
const uploadToCloudinary = (file, folder = 'general') => {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          key: result.public_id,   // public_id acts as the key for deletion
          originalName: file.originalname,
        });
      }
    );

    // Convert buffer to stream and pipe
    const readable = new Readable();
    readable.push(file.buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
