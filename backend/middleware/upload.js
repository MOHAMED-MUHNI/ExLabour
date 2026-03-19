const multer = require('multer');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const path = require('path');
const crypto = require('crypto');

// Multer memory storage (files stored in buffer, then sent to S3)
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

// Upload file to S3
const uploadToS3 = async (file, folder = 'general') => {
  const fileExtension = path.extname(file.originalname);
  const uniqueName = `${folder}/${crypto.randomUUID()}${fileExtension}`;

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: uniqueName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(params));

  // Construct the URL
  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueName}`;

  return { url, key: uniqueName, originalName: file.originalname };
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  if (!key) return;
  
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('S3 delete error:', error.message);
  }
};

module.exports = { upload, uploadToS3, deleteFromS3 };
