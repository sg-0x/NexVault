// Access Control Routes
const express = require('express');
const router = express.Router();
const {
  grantFileAccess,
  revokeFileAccess,
  verifyFileAccess,
  listAccessibleFiles,
} = require('../controllers/access.controller');
// const { authenticate } = require('../middleware/auth');
// const { validateAccessRequest } = require('../middleware/validate');

// POST /api/access/grant - Grant access to a file
// TODO: Add authentication and validation middleware
// router.post('/grant', authenticate, validateAccessRequest, grantFileAccess);
router.post('/grant', grantFileAccess);

// POST /api/access/revoke - Revoke access to a file
// router.post('/revoke', authenticate, validateAccessRequest, revokeFileAccess);
router.post('/revoke', revokeFileAccess);

// GET /api/access/verify/:fileId/:address - Verify access permissions
router.get('/verify/:fileId/:address', verifyFileAccess);

// GET /api/access/files/:address - List all accessible files
router.get('/files/:address', listAccessibleFiles);

module.exports = router;
