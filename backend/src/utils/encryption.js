// AES-256-GCM Encryption Utilities
const crypto = require('crypto');

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits (AES-256)
const IV_LENGTH = 12; // 96 bits (recommended for GCM mode)

/**
 * Generate a random 256-bit AES encryption key
 * @returns {Buffer} 32-byte encryption key
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Encrypt a buffer using AES-256-GCM
 * This provides both confidentiality and authenticity
 * 
 * @param {Buffer} buffer - Data to encrypt
 * @param {Buffer} key - 32-byte encryption key
 * @returns {Object} Object containing ciphertext, iv, and authTag (all as Buffers)
 */
function encryptBuffer(buffer, key) {
  try {
    // Generate random 12-byte IV (96 bits) for GCM
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher instance with AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the buffer in chunks and finalize
    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);

    // Get the authentication tag (provides data integrity)
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted,
      iv: iv,
      authTag: authTag
    };
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt a buffer using AES-256-GCM
 * Verifies authenticity using the auth tag
 * 
 * @param {Buffer} ciphertext - Encrypted data
 * @param {Buffer} key - 32-byte decryption key
 * @param {Buffer} iv - Initialization vector used during encryption
 * @param {Buffer} authTag - Authentication tag for integrity verification
 * @returns {Buffer} Decrypted data
 */
function decryptBuffer(ciphertext, key, iv, authTag) {
  try {
    // Create decipher instance
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Set the authentication tag for verification
    decipher.setAuthTag(authTag);

    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final() // This will throw if auth tag verification fails
    ]);

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Compute SHA-256 hash of a buffer
 * Used for file integrity verification and blockchain storage
 * 
 * @param {Buffer} buffer - Data to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
function computeHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  generateKey,
  encryptBuffer,
  decryptBuffer,
  computeHash
};
