// Firebase Admin SDK and Firestore Configuration
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

let db = null;
let firebaseInitialized = false;

try {
  let serviceAccount = null;
  
  // Priority 1: Check for environment variable (for Railway/cloud deployments)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    logger.info('[FIREBASE] Loading service account from environment variable');
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (parseError) {
      logger.error('[FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY: must be valid JSON');
    }
  } else {
    // Priority 2: Check for file path (for local development)
    const backendRoot = path.resolve(__dirname, '../..'); // Go up from src/config to backend/
    const defaultServiceAccountPath = path.join(backendRoot, 'serviceAccountKey.json');
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || defaultServiceAccountPath;
    
    // Check if file exists
    const fileExists = fs.existsSync(serviceAccountPath);
    
    if (fileExists) {
      logger.info(`[FIREBASE] Loading service account from file: ${serviceAccountPath}`);
      const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountJson);
    } else {
      logger.warn('⚠️  Firebase service account not found - Firestore will not be available (DEV MODE)');
      logger.warn(`⚠️  Expected location: ${serviceAccountPath}`);
      logger.warn('⚠️  For production: Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
      logger.warn('⚠️  For local dev: Download serviceAccountKey.json from Firebase Console and place in backend/');
    }
  }
  
  // Initialize Firebase if we have a service account
  if (serviceAccount) {
    // Validate required fields
    if (!serviceAccount.project_id || !serviceAccount.private_key) {
      throw new Error('Invalid service account key: missing project_id or private_key');
    }
    
    // Only initialize if not already initialized
    if (!admin.apps.length) {
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

