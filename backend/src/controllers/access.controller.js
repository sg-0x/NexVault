// Access Control Controller
// Handles file access permissions and blockchain interactions

const logger = require('../utils/logger');
const { 
  grantFileAccess: grantAccessBlockchain, 
  revokeFileAccess: revokeAccessBlockchain,
  hasFileAccess,
  getAccessibleFileHashes
} = require('../utils/blockchain');
const { getFirestore, isFirestoreAvailable } = require('../config/firebase');

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
 * @route GET /api/access/verify/:fileHash/:address
 */
const verifyFileAccess = async (req, res, next) => {
  try {
    const { fileHash, address } = req.params;

    if (!fileHash || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing fileHash or address parameter'
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    logger.info(`[INFO] Access verification requested for file ${fileHash.substring(0, 10)}... by ${address}`);

    // Check blockchain for access permissions
    const hasAccess = await hasFileAccess(fileHash, address);

    logger.success(`[SUCCESS] Access verification completed. Has access: ${hasAccess}`);

    res.status(200).json({
      success: true,
      data: {
        fileHash,
        address,
        hasAccess: hasAccess,
      },
    });
  } catch (error) {
    logger.error('[ERROR] Access verification failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to verify access',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * List all files accessible by an address
 * @route GET /api/access/files/:address
 */
const listAccessibleFiles = async (req, res, next) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing address parameter'
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    logger.info(`[INFO] File list requested for address: ${address}`);

    // Query blockchain for all file hashes accessible by this address
    const accessibleHashes = await getAccessibleFileHashes(address);
    
    logger.info(`[INFO] Found ${accessibleHashes.length} accessible file hashes on blockchain`);

    // If no accessible files, return empty array
    if (accessibleHashes.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        files: [],
        address: address,
      });
    }

    // Fetch file metadata from Firestore for these hashes
    if (!isFirestoreAvailable()) {
      logger.warn('[WARN] Firestore not available - returning hashes only');
      return res.status(200).json({
        success: true,
        count: accessibleHashes.length,
        files: accessibleHashes.map(hash => ({ hash })),
        address: address,
        message: 'Firestore not configured - returning hashes only'
      });
    }

    const db = getFirestore();
    const files = [];

    // Query Firestore for files matching these hashes
    // Note: We need to query by hash field in Firestore
    for (const hash of accessibleHashes) {
      try {
        // Query Firestore for files with this hash
        const snapshot = await db
          .collection('files')
          .where('hash', '==', hash.startsWith('0x') ? hash : `0x${hash}`)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          files.push({
            id: doc.id,
            ...doc.data(),
          });
        } else {
          // File exists on blockchain but not in Firestore (edge case)
          logger.warn(`[WARN] File hash ${hash.substring(0, 10)}... found on blockchain but not in Firestore`);
          files.push({
            hash: hash,
            fileName: 'Unknown (blockchain only)',
            existsInFirestore: false,
          });
        }
      } catch (firestoreError) {
        logger.error(`[ERROR] Failed to fetch Firestore data for hash ${hash.substring(0, 10)}...: ${firestoreError.message}`);
      }
    }

    logger.success(`[SUCCESS] Retrieved ${files.length} accessible files for address ${address}`);

    res.status(200).json({
      success: true,
      count: files.length,
      files: files,
      address: address,
    });
  } catch (error) {
    logger.error('[ERROR] File list retrieval failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve accessible files',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  grantFileAccess,
  revokeFileAccess,
  verifyFileAccess,
  listAccessibleFiles,
};
