// Firebase Admin SDK and Firestore Configuration
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let db = null;
let firebaseInitialized = false;

try {
  // Resolve service account path - check both env variable and default location
  // Default location: backend/serviceAccountKey.json (relative to backend root)
  const backendRoot = path.resolve(__dirname, '../..'); // Go up from src/config to backend/
  const defaultServiceAccountPath = path.join(backendRoot, 'serviceAccountKey.json');
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || defaultServiceAccountPath;
  
  // Check if file exists
  const fileExists = fs.existsSync(serviceAccountPath);
  
  if (fileExists) {
    logger.info(`[FIREBASE] Loading service account from: ${serviceAccountPath}`);
    
    // Only initialize if not already initialized
    if (!admin.apps.length) {
      // Read and parse JSON file (more reliable than require)
      const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key) {
        throw new Error('Invalid service account key: missing project_id or private_key');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      logger.success('✅ Firebase Admin SDK initialized successfully');
      logger.info(`[FIREBASE] Project: ${serviceAccount.project_id}`);
    }
    
    // Initialize Firestore
    db = admin.firestore();
    firebaseInitialized = true;
    logger.success('✅ Firestore initialized successfully');
  } else {
    logger.warn('⚠️  Firebase service account not found - Firestore will not be available (DEV MODE)');
    logger.warn(`⚠️  Expected location: ${serviceAccountPath}`);
    logger.warn('⚠️  Download serviceAccountKey.json from Firebase Console and place in backend/');
  }
} catch (error) {
  logger.error('⚠️  Firebase/Firestore initialization failed:', error.message);
  logger.error('⚠️  Error details:', error.stack);
  logger.warn('⚠️  Firestore persistence will be skipped (DEV MODE)');
}

/**
 * Get Firestore database instance
 * @returns {admin.firestore.Firestore|null} Firestore instance or null if not initialized
 */
function getFirestore() {
  return db;
}

/**
 * Check if Firestore is available
 * @returns {boolean} True if Firestore is initialized
 */
function isFirestoreAvailable() {
  return firebaseInitialized && db !== null;
}

module.exports = {
  admin,
  db,
  getFirestore,
  isFirestoreAvailable,
};

