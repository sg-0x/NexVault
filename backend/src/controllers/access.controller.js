// Access Control Controller
// Handles file access permissions and blockchain interactions

const logger = require('../utils/logger');
const { grantFileAccess: grantAccessBlockchain, revokeFileAccess: revokeAccessBlockchain } = require('../utils/blockchain');

/**
 * Grant access to a file
 * @route POST /api/access/grant
 */
const grantFileAccess = async (req, res, next) => {
  try {
    const { fileHash, grantee } = req.body;

    // Validate required fields
    if (!fileHash || !grantee) {
      logger.warn('Access grant attempt with missing parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing fileHash or grantee address'
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(grantee)) {
      logger.warn(`Invalid Ethereum address format: ${grantee}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format for grantee'
      });
    }

    logger.info(`[INFO] Granting access to ${grantee} for file ${fileHash.substring(0, 10)}...`);

    // Call blockchain function to grant access
    const txHash = await grantAccessBlockchain(fileHash, grantee);

    logger.success(`Access granted successfully. TxHash: ${txHash}`);

    res.status(200).json({
      success: true,
      message: `Access granted to ${grantee}`,
      txHash: txHash,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[ERROR] grantAccess controller:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Blockchain transaction failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Revoke access to a file
 * @route POST /api/access/revoke
 */
const revokeFileAccess = async (req, res, next) => {
  try {
    const { fileHash, grantee } = req.body;

    // Validate required fields
    if (!fileHash || !grantee) {
      logger.warn('Access revoke attempt with missing parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing fileHash or grantee address'
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(grantee)) {
      logger.warn(`Invalid Ethereum address format: ${grantee}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format for grantee'
      });
    }

    logger.info(`[INFO] Revoking access for ${grantee} on file ${fileHash.substring(0, 10)}...`);

    // Call blockchain function to revoke access
    const txHash = await revokeAccessBlockchain(fileHash, grantee);

    logger.success(`Access revoked successfully. TxHash: ${txHash}`);

    res.status(200).json({
      success: true,
      message: `Access revoked for ${grantee}`,
      txHash: txHash,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[ERROR] revokeAccess controller:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Blockchain transaction failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify access to a file
 * @route GET /api/access/verify/:fileId/:address
 */
const verifyFileAccess = async (req, res, next) => {
  try {
    const { fileId, address } = req.params;

    // TODO: Implement access verification logic
    // 1. Check blockchain for access permissions
    // 2. Return access status

    logger.info(`Access verification requested for file ${fileId} by ${address}`);

    res.status(200).json({
      success: true,
      message: 'Access verification route active',
      data: {
        fileId,
        address,
        hasAccess: true,
      },
    });
  } catch (error) {
    logger.error('Access verification failed:', error.message);
    next(error);
  }
};

/**
 * List all files accessible by an address
 * @route GET /api/access/files/:address
 */
const listAccessibleFiles = async (req, res, next) => {
  try {
    const { address } = req.params;

    // TODO: Query blockchain for all files accessible by address

    logger.info(`File list requested for address: ${address}`);

    res.status(200).json({
      success: true,
      message: 'File list route active',
      data: {
        address,
        files: [],
      },
    });
  } catch (error) {
    logger.error('File list retrieval failed:', error.message);
    next(error);
  }
};

module.exports = {
  grantFileAccess,
  revokeFileAccess,
  verifyFileAccess,
  listAccessibleFiles,
};
