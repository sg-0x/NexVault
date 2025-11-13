// User Routes
const express = require('express');
const router = express.Router();
const {
  linkWalletAddress,
  unlinkWalletAddress,
  getWalletAddresses,
} = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

// POST /api/user/wallet/link - Link a wallet address to user account
router.post('/wallet/link', authenticate, linkWalletAddress);

// POST /api/user/wallet/unlink - Unlink a wallet address from user account
router.post('/wallet/unlink', authenticate, unlinkWalletAddress);

// GET /api/user/wallet - Get user's linked wallet addresses
router.get('/wallet', authenticate, getWalletAddresses);

module.exports = router;

