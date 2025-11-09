// Download Routes
const express = require('express');
const router = express.Router();
const { 
  downloadFile, 
  downloadAndDecrypt,
  getFileMetadata 
} = require('../controllers/download.controller');
// const { authenticate } = require('../middleware/auth');

// GET /api/download/:key - Get pre-signed download URL for encrypted file
// Returns a temporary URL to download the encrypted file from S3
// TODO: Add authentication middleware
// router.get('/:key', authenticate, downloadFile);
router.get('/:key', downloadFile);

// POST /api/download/decrypt - Download and decrypt file on server
// Accepts encryption parameters and returns decrypted file
// TODO: Add authentication middleware
router.post('/decrypt', downloadAndDecrypt);

// GET /api/download/metadata/:key - Get file metadata from blockchain
// TODO: Implement blockchain metadata retrieval in Part 4
router.get('/metadata/:key', getFileMetadata);

module.exports = router;
