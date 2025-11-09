// Upload Controller
// Handles file upload, encryption, and storage operations

const logger = require('../utils/logger');
const { generateKey, encryptBuffer, computeHash } = require('../utils/encryption');
const { uploadToS3 } = require('../utils/s3');
const { addFileRecord } = require('../utils/blockchain');

/**
 * Handle file upload, encryption, and S3 storage
 * @route POST /api/upload
 * @param {Object} req - Express request object (file in req.file from multer)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const uploadFile = async (req, res, next) => {
  try {
    // Step 1: Validate that a file was uploaded
    if (!req.file) {
      logger.warn('Upload attempt with no file provided');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a file in the "file" field.'
      });
    }

    // Extract file information from multer
    const { originalname, mimetype, size, buffer } = req.file;
    
    logger.info(`File upload started: ${originalname} (${(size / 1024 / 1024).toFixed(2)} MB)`);

    // Step 2: Generate a random 256-bit AES encryption key
    // In production, this would be encrypted with a master key or stored in KMS
    const aesKey = generateKey();
    logger.debug('Generated AES-256 encryption key');

    // Step 3: Encrypt the file buffer using AES-256-GCM
    // This provides both confidentiality and authenticity
    const { ciphertext, iv, authTag } = encryptBuffer(buffer, aesKey);
    logger.info(`File encrypted successfully: ${originalname}`);

    // Step 4: Compute SHA-256 hash of the encrypted file
    // This hash will be stored on the blockchain for integrity verification
    const fileHash = computeHash(ciphertext);
    logger.debug(`Computed file hash: ${fileHash.substring(0, 16)}...`);

    // Step 5: Generate a unique S3 key for the encrypted file
    // Using timestamp + original filename to ensure uniqueness
    const uniqueKey = `${Date.now()}_${originalname}`;
    logger.debug(`Generated S3 key: ${uniqueKey}`);

    // Step 6: Upload the encrypted file to AWS S3
    const s3Url = await uploadToS3(uniqueKey, ciphertext, mimetype);
    logger.info(`Encrypted file uploaded to S3: ${s3Url}`);

    // Step 7: Record file metadata on blockchain
    let txHash = null;
    try {
      logger.info('[INFO] Recording file metadata on blockchain...');
      txHash = await addFileRecord(fileHash, uniqueKey);
      logger.success(`[SUCCESS] Blockchain transaction completed. TxHash: ${txHash}`);
    } catch (blockchainErr) {
      logger.warn('[WARN] Blockchain write failed:', blockchainErr.message);
      // Continue with response even if blockchain fails
    }

    // Step 8: Prepare metadata response
    // Convert binary data to base64 for JSON transmission
    const metadata = {
      fileName: originalname,
      s3Key: uniqueKey, // S3 key needed for download
      s3Url: s3Url, // Full S3 URL
      mimeType: mimetype,
      originalSizeMB: parseFloat((size / 1024 / 1024).toFixed(4)),
      encryptedSizeMB: parseFloat((ciphertext.length / 1024 / 1024).toFixed(4)),
      hash: fileHash, // SHA-256 hash in hex format (for blockchain)
      txHash: txHash, // Blockchain transaction hash
      iv: iv.toString('base64'), // Initialization vector (needed for decryption)
      authTag: authTag.toString('base64'), // Authentication tag (for GCM verification)
      aesKey: aesKey.toString('base64'), // AES key (for demo - in production, encrypt this!)
      uploadedAt: new Date().toISOString()
    };

    // Step 9: Return success response with metadata
    logger.success(`File upload completed: ${originalname}`);

    const responseMessage = txHash 
      ? 'File encrypted, uploaded, and recorded on blockchain'
      : 'File encrypted and uploaded successfully (blockchain recording failed)';

    res.status(200).json({
      success: true,
      message: responseMessage,
      metadata: metadata
    });

  } catch (error) {
    // Handle any errors during the upload/encryption process
    logger.error('Upload failed:', error.message);
    
    // Check if it's a multer error (file too large, etc.)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum size is 50 MB.'
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'File upload failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get upload status
 * @route GET /api/upload/status/:fileId
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUploadStatus = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    logger.info(`Upload status requested for: ${fileId}`);

    // TODO: In future, query database or S3 for actual upload status
    res.status(200).json({
      success: true,
      message: 'Status route active',
      data: {
        fileId,
        status: 'completed',
        message: 'Status tracking will be implemented with database integration'
      },
    });
  } catch (error) {
    logger.error('Status check failed:', error.message);
    next(error);
  }
};

module.exports = {
  uploadFile,
  getUploadStatus,
};
