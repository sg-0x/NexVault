// Authentication Middleware - Firebase Token Verification
const { admin, isFirestoreAvailable } = require('../config/firebase');
const logger = require('../utils/logger');

// Check if Firebase is initialized
const firebaseInitialized = isFirestoreAvailable();

/**
 * Verify Firebase ID token from Authorization header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // If Firebase is not initialized, bypass authentication in development
    if (!firebaseInitialized) {
      logger.debug('[DEV MODE] Bypassing authentication - Firebase not configured');
      req.user = { uid: 'dev-user', email: 'dev@nexvault.local' };
      return next();
    }

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No authorization header provided',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>',
      });
    }

    // Extract token
    const token = authHeader.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    // Verify token with Firebase
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Attach user info to request object
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
      };

      logger.debug(`[AUTH] User authenticated: ${decodedToken.email || decodedToken.uid}`);
      next();
    } catch (verifyError) {
      logger.error('[AUTH] Token verification failed:', verifyError.message);
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        details: verifyError.message,
      });
    }
  } catch (error) {
    logger.error('[AUTH] Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      details: error.message,
    });
  }
};

/**
 * Optional authentication - allows both authenticated and unauthenticated requests
 * If token is provided, it will be verified, otherwise req.user will be null
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !firebaseInitialized) {
    req.user = null;
    return next();
  }

  // If auth header exists, verify it
  return authenticate(req, res, next);
};

module.exports = { authenticate, optionalAuth };
