// User Controller
// Handles user profile management and wallet address linking

const logger = require('../utils/logger');
const { getFirestore, isFirestoreAvailable } = require('../config/firebase');

/**
 * Link a wallet address to user account
 * @route POST /api/user/wallet/link
 */
const linkWalletAddress = async (req, res, next) => {
  try {
    const uid = req.user ? req.user.uid : null;
    const { address } = req.body;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing wallet address',
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format',
      });
    }

    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    logger.info(`[USER] Linking wallet ${address} to user ${uid}`);

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);

    // Get current user data
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const walletAddresses = userData.walletAddresses || [];

    // Check if address is already linked
    const normalizedAddress = address.toLowerCase();
    if (walletAddresses.some(addr => addr.toLowerCase() === normalizedAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address already linked',
      });
    }

    // Add address to array
    walletAddresses.push(normalizedAddress);

    // Update user document
    await userRef.set({
      ...userData,
      walletAddresses: walletAddresses,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    logger.success(`[USER] Wallet ${address} linked successfully to user ${uid}`);

    res.status(200).json({
      success: true,
      message: 'Wallet address linked successfully',
      walletAddresses: walletAddresses,
    });
  } catch (error) {
    logger.error('[USER] Error linking wallet address:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to link wallet address',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Unlink a wallet address from user account
 * @route POST /api/user/wallet/unlink
 */
const unlinkWalletAddress = async (req, res, next) => {
  try {
    const uid = req.user ? req.user.uid : null;
    const { address } = req.body;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing wallet address',
      });
    }

    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    logger.info(`[USER] Unlinking wallet ${address} from user ${uid}`);

    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);

    // Get current user data
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const walletAddresses = userData.walletAddresses || [];

    // Remove address from array
    const normalizedAddress = address.toLowerCase();
    const updatedAddresses = walletAddresses.filter(
      addr => addr.toLowerCase() !== normalizedAddress
    );

    if (updatedAddresses.length === walletAddresses.length) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address not found in linked addresses',
      });
    }

    // Update user document
    await userRef.set({
      ...userData,
      walletAddresses: updatedAddresses,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    logger.success(`[USER] Wallet ${address} unlinked successfully from user ${uid}`);

    res.status(200).json({
      success: true,
      message: 'Wallet address unlinked successfully',
      walletAddresses: updatedAddresses,
    });
  } catch (error) {
    logger.error('[USER] Error unlinking wallet address:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink wallet address',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get user's linked wallet addresses
 * @route GET /api/user/wallet
 */
const getWalletAddresses = async (req, res, next) => {
  try {
    const uid = req.user ? req.user.uid : null;

    if (!uid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!isFirestoreAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firestore not available',
      });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(200).json({
        success: true,
        walletAddresses: [],
      });
    }

    const userData = userDoc.data();
    const walletAddresses = userData.walletAddresses || [];

    res.status(200).json({
      success: true,
      walletAddresses: walletAddresses,
    });
  } catch (error) {
    logger.error('[USER] Error fetching wallet addresses:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet addresses',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  linkWalletAddress,
  unlinkWalletAddress,
  getWalletAddresses,
};

