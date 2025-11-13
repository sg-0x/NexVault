// Download Controller
// Handles file download, decryption, and retrieval operations

const logger = require('../utils/logger');
const { getFileFromS3, downloadFromS3 } = require('../utils/s3');
const { decryptBuffer } = require('../utils/encryption');
const { hasFileAccess } = require('../utils/blockchain');
const { getFirestore, isFirestoreAvailable } = require('../config/firebase');

/**
 * Generate a pre-signed URL for downloading encrypted file from S3
 * @route GET /api/download/:key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const downloadFile = async (req, res, next) => {
  try {
    // Extract the S3 key from URL parameters
    const { key } = req.params;

    // Validate that key parameter exists
    if (!key) {
      logger.warn('Download attempt without key parameter');
      return res.status(400).json({
        success: false,
        error: 'Missing key parameter. Provide the S3 key of the file to download.'
      });
    }

    logger.info(`Download URL requested for: ${key}`);

    // Verify user has access permission via blockchain
    try {
      // Get file hash from Firestore
      if (isFirestoreAvailable()) {
        const db = getFirestore();
        const fileSnapshot = await db.collection('files').where('s3Key', '==', key).limit(1).get();
        
        if (!fileSnapshot.empty) {
          const fileData = fileSnapshot.docs[0].data();
          const fileHash = fileData.hash;
          const fileOwner = fileData.uid;
          const currentUser = req.user ? req.user.uid : null;

          // If user is the owner, allow access
          if (currentUser && fileOwner === currentUser) {
            logger.debug(`[DOWNLOAD] User ${currentUser} is owner of file ${key}`);
          } else {
            // Check blockchain access for user's wallet addresses
            const userDoc = await db.collection('users').doc(currentUser).get();
            const userData = userDoc.exists ? userDoc.data() : {};
            const walletAddresses = userData.walletAddresses || [];

            let hasAccess = false;
            for (const address of walletAddresses) {
              try {
                if (await hasFileAccess(fileHash, address)) {
                  hasAccess = true;
                  break;
                }
              } catch (err) {
                logger.warn(`[WARN] Failed to verify access for ${address}: ${err.message}`);
              }
            }

            if (!hasAccess) {
              logger.warn(`[DOWNLOAD] Access denied for user ${currentUser} to file ${key}`);
              return res.status(403).json({
                success: false,
                error: 'Access denied. You do not have permission to download this file.'
              });
            }
          }
        }
      }
    } catch (accessError) {
      logger.warn(`[WARN] Access verification failed for ${key}: ${accessError.message}`);
      // Continue with download if verification fails (graceful degradation)
    }

    // Generate a pre-signed URL valid for 5 minutes (300 seconds)
    // This allows the client to download the encrypted file directly from S3
    const signedUrl = await getFileFromS3(key, 300);

    logger.success(`Pre-signed download URL generated for: ${key}`);

    res.status(200).json({
      success: true,
      message: 'Download URL generated successfully',
      data: {
        key: key,
        downloadUrl: signedUrl,
        expiresIn: 300, // seconds
        note: 'This URL provides access to the encrypted file. Use the encryption key, IV, and authTag to decrypt.'
      }
    });

  } catch (error) {
    logger.error('Download URL generation failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate download URL',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Download and decrypt a file (full decryption on server side)
 * @route POST /api/download/decrypt
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const downloadAndDecrypt = async (req, res, next) => {
  try {
    const { key, aesKey, iv, authTag } = req.body;

    // Validate required parameters
    if (!key || !aesKey || !iv || !authTag) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: key, aesKey, iv, authTag'
      });
    }

    logger.info(`Decryption download requested for: ${key}`);

    // Step 1: Download encrypted file from S3
    const encryptedBuffer = await downloadFromS3(key);
    logger.debug(`Downloaded encrypted file: ${encryptedBuffer.length} bytes`);

    // Step 2: Convert base64 strings to buffers
    const keyBuffer = Buffer.from(aesKey, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');

    // Step 3: Decrypt the file
    const decryptedBuffer = decryptBuffer(encryptedBuffer, keyBuffer, ivBuffer, authTagBuffer);
    logger.info(`File decrypted successfully: ${decryptedBuffer.length} bytes`);

    // Step 4: Send the decrypted file to the client
    // Set appropriate headers for file download
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': decryptedBuffer.length,
      'Content-Disposition': `attachment; filename="${key}"`,
    });

    res.send(decryptedBuffer);
    logger.success(`Decrypted file sent to client: ${key}`);

  } catch (error) {
    logger.error('Decryption download failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to download and decrypt file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get file metadata
 * @route GET /api/download/metadata/:key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getFileMetadata = async (req, res, next) => {
  try {
    const { key } = req.params;

    // TODO: In Part 4, retrieve metadata from blockchain
    // const metadata = await getFileMetadataFromBlockchain(key);

    logger.info(`Metadata requested for: ${key}`);

    res.status(200).json({
      success: true,
      message: 'Metadata retrieval - blockchain integration pending',
      data: {
        key: key,
        note: 'Metadata will be retrieved from blockchain in Part 4'
      },
    });
  } catch (error) {
    logger.error('Metadata retrieval failed:', error.message);
    next(error);
  }
};

module.exports = {
  downloadFile,
  downloadAndDecrypt,
  getFileMetadata,
};
