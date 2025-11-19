// Files Controller
// Handles fetching and managing user file metadata

const logger = require('../utils/logger');
const { getFirestore, isFirestoreAvailable } = require('../config/firebase');
const { getAccessibleFileHashes } = require('../utils/blockchain');

/**
 * Get all files uploaded by the authenticated user
 * @route GET /api/files
 * @param {Object} req - Express request object (user info from auth middleware)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserFiles = async (req, res, next) => {
  try {
    // Get user ID from authenticated request
    const uid = req.user ? req.user.uid : null;

    if (!uid) {
      logger.warn('[FILES] Unauthorized file fetch attempt');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Please log in to view your files.',
      });
    }

    // Check if Firestore is available
    if (!isFirestoreAvailable()) {
      logger.warn('[FILES] Firestore not available - returning empty array');
      return res.status(200).json({
        success: true,
        message: 'Firestore not configured (DEV MODE)',
        files: [],
      });
    }

    logger.info(`[FILES] Fetching files for user: ${uid}`);

    // Query Firestore for files belonging to this user
    const db = getFirestore();
    
    try {
      // Try query with orderBy first (requires index)
      let snapshot;
      try {
        snapshot = await db
          .collection('files')
          .where('uid', '==', uid)
          .orderBy('uploadedAt', 'desc') // Most recent first
          .get();
      } catch (orderByError) {
        // If orderBy fails (no index), try without it
        if (orderByError.code === 9 || orderByError.message?.includes('index')) {
          logger.warn('[FILES] OrderBy index not found, fetching without sorting');
          snapshot = await db
            .collection('files')
            .where('uid', '==', uid)
            .get();
          
          // Sort in memory instead
          const docs = snapshot.docs;
          docs.sort((a, b) => {
            const aTime = a.data().uploadedAt || '';
            const bTime = b.data().uploadedAt || '';
            return bTime.localeCompare(aTime); // Descending
          });
          snapshot = { docs };
        } else {
          throw orderByError;
        }
      }

      // Map Firestore documents to array
      const ownedFiles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        isOwner: true,
        isShared: false,
      }));

      // Also fetch files shared with user's wallet addresses
      // This is done in parallel to avoid blocking the response
      let sharedFiles = [];
      const fetchSharedFiles = async () => {
        try {
          // Get user's linked wallet addresses from Firestore
          const userDoc = await db.collection('users').doc(uid).get();
          const userData = userDoc.exists ? userDoc.data() : {};
          const walletAddresses = userData.walletAddresses || [];

          if (walletAddresses.length === 0) {
            return [];
          }

          logger.info(`[FILES] Checking shared files for ${walletAddresses.length} wallet address(es)`);
          
          // Get all accessible file hashes for all wallet addresses in parallel
          const hashPromises = walletAddresses.map(async (address) => {
            try {
              return await getAccessibleFileHashes(address);
            } catch (err) {
              logger.warn(`[WARN] Failed to get accessible files for ${address}: ${err.message}`);
              return [];
            }
          });
          
          const hashArrays = await Promise.all(hashPromises);
          const allAccessibleHashes = new Set();
          hashArrays.forEach(hashes => {
            hashes.forEach(hash => allAccessibleHashes.add(hash));
          });

          if (allAccessibleHashes.size === 0) {
            return [];
          }

          // Batch fetch file metadata from Firestore for shared files
          // Use Promise.all for parallel queries instead of sequential
          const filePromises = Array.from(allAccessibleHashes).map(async (hash) => {
            try {
              // Blockchain returns with 0x prefix (lowercase), but Firestore stores without it
              // Try both formats to ensure we find the file
              const hashWithout0x = hash.startsWith('0x') ? hash.slice(2) : hash;
              const hashWith0x = hash.startsWith('0x') ? hash : `0x${hash}`;
              
              // Try query with 0x first
              let sharedSnapshot = await db
                .collection('files')
                .where('hash', '==', hashWith0x)
                .limit(1)
                .get();

              // If not found, try without 0x
              if (sharedSnapshot.empty) {
                sharedSnapshot = await db
                  .collection('files')
                  .where('hash', '==', hashWithout0x)
                  .limit(1)
                  .get();
              }

              if (!sharedSnapshot.empty) {
                const doc = sharedSnapshot.docs[0];
                const fileData = doc.data();
                
                // Only include if not already in owned files (avoid duplicates)
                if (!ownedFiles.find(f => f.id === doc.id)) {
                  logger.info(`[FILES] Found shared file: ${fileData.fileName} (hash: ${hash.substring(0, 10)}...)`);
                  return {
                    id: doc.id,
                    ...fileData,
                    isOwner: false,
                    isShared: true,
                  };
                }
              } else {
                logger.warn(`[FILES] File with hash ${hash.substring(0, 10)}... exists on blockchain but not in Firestore`);
              }
              return null;
            } catch (err) {
              logger.warn(`[WARN] Failed to fetch shared file ${hash.substring(0, 10)}...: ${err.message}`);
              return null;
            }
          });
          
          const fileResults = await Promise.all(filePromises);
          const validFiles = fileResults.filter(f => f !== null);
          
          logger.info(`[FILES] Found ${validFiles.length} shared files`);
          return validFiles;
        } catch (sharedError) {
          logger.warn(`[WARN] Failed to fetch shared files: ${sharedError.message}`);
          return [];
        }
      };

      // Fetch shared files in parallel (don't block the response)
      // For now, we'll wait for it, but we could make it async in the future
      sharedFiles = await fetchSharedFiles();

      // Combine owned and shared files
      const allFiles = [...ownedFiles, ...sharedFiles];

      logger.success(`[FILES] Retrieved ${ownedFiles.length} owned files and ${sharedFiles.length} shared files for user: ${uid}`);

      res.status(200).json({
        success: true,
        count: allFiles.length,
        files: allFiles,
        owned: ownedFiles.length,
        shared: sharedFiles.length,
      });
    } catch (firestoreError) {
      // Handle Firestore-specific errors
      if (firestoreError.code === 5 || firestoreError.code === 'NOT_FOUND') {
        logger.warn('[FILES] Firestore database not found. This usually means:');
        logger.warn('[FILES] 1. Firestore needs to be enabled in Firebase Console');
        logger.warn('[FILES] 2. Database location needs to be set');
        logger.warn('[FILES] Returning empty array - database will be created on first write');
        
        // Return empty array instead of error - database will be created on first file upload
        return res.status(200).json({
          success: true,
          count: 0,
          files: [],
          message: 'Firestore database not initialized yet. Upload a file to create it.',
        });
      }
      
      // Re-throw other errors
      throw firestoreError;
    }
  } catch (error) {
    logger.error('[FILES] Error fetching user files:', error.message);
    logger.error('[FILES] Error code:', error.code);
    logger.error('[FILES] Error details:', error);
    
    // Provide helpful error message
    let errorMessage = 'Failed to fetch files';
    if (error.code === 5 || error.code === 'NOT_FOUND') {
      errorMessage = 'Firestore database not found. Please enable Firestore in Firebase Console.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
};

/**
 * Get a single file by ID
 * @route GET /api/files/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;
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

    logger.info(`[FILES] Fetching file ${id} for user: ${uid}`);

    const db = getFirestore();
    const docRef = db.collection('files').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      logger.warn(`[FILES] File not found: ${id}`);
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    const fileData = doc.data();

    // Verify the file belongs to the requesting user
    if (fileData.uid !== uid) {
      logger.warn(`[FILES] Unauthorized access attempt to file ${id} by user ${uid}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have access to this file.',
      });
    }

    logger.success(`[FILES] File retrieved: ${id}`);

    res.status(200).json({
      success: true,
      file: {
        id: doc.id,
        ...fileData,
      },
    });
  } catch (error) {
    logger.error('[FILES] Error fetching file by ID:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete a file (mark as deleted or remove from Firestore)
 * @route DELETE /api/files/:id
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
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

    logger.info(`[FILES] Delete request for file ${id} by user: ${uid}`);

    const db = getFirestore();
    const docRef = db.collection('files').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    const fileData = doc.data();

    // Verify ownership
    if (fileData.uid !== uid) {
      logger.warn(`[FILES] Unauthorized delete attempt on file ${id} by user ${uid}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden. You do not own this file.',
      });
    }

    // Delete from Firestore
    await docRef.delete();
    logger.success(`[FILES] File ${id} deleted from Firestore`);

    // TODO: Also delete from S3 and update blockchain if needed
    // const { s3Key } = fileData;
    // await deleteFromS3(s3Key);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      fileId: id,
    });
  } catch (error) {
    logger.error('[FILES] Error deleting file:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getUserFiles,
  getFileById,
  deleteFile,
};
