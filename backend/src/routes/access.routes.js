// Access Control Routes
const express = require('express');
const router = express.Router();
const {
  grantFileAccess,
  revokeFileAccess,
  verifyFileAccess,
  listAccessibleFiles,
} = require('../controllers/access.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');

// POST /api/access/grant - Grant access to a file
// Protected by authentication middleware
router.post('/grant', authenticate, grantFileAccess);

// POST /api/access/revoke - Revoke access to a file
// Protected by authentication middleware
router.post('/revoke', authenticate, revokeFileAccess);

// GET /api/access/verify/:fileHash/:address - Verify access permissions
// Public endpoint - no auth required
router.get('/verify/:fileHash/:address', verifyFileAccess);

// GET /api/access/files/:address - List all accessible files
// Optional authentication
router.get('/files/:address', optionalAuth, listAccessibleFiles);

module.exports = router;
