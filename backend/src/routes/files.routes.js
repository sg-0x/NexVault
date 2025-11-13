// Files Routes
// Routes for fetching and managing user file metadata
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getUserFiles, getFileById, deleteFile } = require('../controllers/files.controller');

// GET /api/files - Get all files for authenticated user
// Protected by authentication middleware
router.get('/', authenticate, getUserFiles);

// GET /api/files/:id - Get specific file by ID
// Protected by authentication middleware
router.get('/:id', authenticate, getFileById);

// DELETE /api/files/:id - Delete a file
// Protected by authentication middleware
router.delete('/:id', authenticate, deleteFile);

module.exports = router;
