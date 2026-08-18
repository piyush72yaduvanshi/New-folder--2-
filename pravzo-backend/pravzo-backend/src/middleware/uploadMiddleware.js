'use strict';

const multer = require('multer');
const path = require('path');
const { uploadFile } = require('../config/minio');
const logger = require('../utils/logger');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
]);

// Use memory storage so no local files are left on server disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return cb(new Error('Only JPG, PNG, WEBP, and PDF files are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

/**
 * Middleware: Uploads any incoming files in req.files / req.file directly to MinIO,
 * attaches cloud URLs to req.body, and leaves ZERO local files on disk.
 */
function processCloudUploads() {
  return async (req, res, next) => {
    try {
      if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const fileUrl = await uploadFile(req.file.buffer, fileName, req.file.mimetype);

        req.file.cloudUrl = fileUrl;
        req.file.cloudFilename = fileName;

        // If field name matches, attach to req.body
        if (req.file.fieldname) {
          req.body[req.file.fieldname] = fileUrl;
        }
      }

      if (req.files) {
        // req.files can be an array or an object of arrays
        const fileList = Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat();

        for (const file of fileList) {
          const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
          const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          const fileUrl = await uploadFile(file.buffer, fileName, file.mimetype);

          file.cloudUrl = fileUrl;
          file.cloudFilename = fileName;

          if (file.fieldname) {
            req.body[file.fieldname] = fileUrl;
          }
        }
      }

      next();
    } catch (err) {
      logger.error('Cloud Upload Middleware Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload document to cloud storage',
        error: err.message
      });
    }
  };
}

module.exports = {
  upload,
  processCloudUploads
};
