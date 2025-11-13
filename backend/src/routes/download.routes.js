// Download Routes
const express = require('express');
const router = express.Router();
const { 
  downloadFile, 
  downloadAndDecrypt,
  getFileMetadata 
} = require('../controllers/download.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');

// GET /api/download/:key - Get pre-signed download URL for encrypted file
// Returns a temporary URL to download the encrypted file from S3
// Protected by authentication middleware
router.get('/:key', authenticate, downloadFile);

// POST /api/download/decrypt - Download and decrypt file on server
// Accepts encryption parameters and returns decrypted file
// Protected by authentication middleware
router.post('/decrypt', authenticate, downloadAndDecrypt);

// GET /api/download/metadata/:key - Get file metadata from blockchain
// Optional authentication
router.get('/metadata/:key', optionalAuth, getFileMetadata);

module.exports = router;
