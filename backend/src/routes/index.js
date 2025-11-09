// Main Routes Index
// Consolidates all route modules

const express = require('express');
const router = express.Router();

// Import route modules
const uploadRoutes = require('./upload.routes');
const downloadRoutes = require('./download.routes');
const accessRoutes = require('./access.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'NexVault backend running',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/upload', uploadRoutes);
router.use('/download', downloadRoutes);
router.use('/access', accessRoutes);

module.exports = router;
