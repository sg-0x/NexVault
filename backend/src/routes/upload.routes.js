// Upload Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, getUploadStatus } = require('../controllers/upload.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Configure Multer for in-memory file storage
// Files are stored as Buffer objects in req.file.buffer
const storage = multer.memoryStorage();

// Configure file upload limits and storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB maximum file size
  }
});

// POST /api/upload - Upload and encrypt a file
// Accepts multipart/form-data with 'file' field
// Protected by authentication middleware
router.post('/', authenticate, upload.single('file'), uploadFile);

// GET /api/upload/status/:fileId - Check upload status
// Optional authentication - works with or without token
router.get('/status/:fileId', optionalAuth, getUploadStatus);

module.exports = router;
