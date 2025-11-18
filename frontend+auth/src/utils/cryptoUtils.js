// Client-Side Cryptography Utilities for NexVault
// Implements AES-256-GCM decryption using Web Crypto API

/**
 * Check if browser supports Web Crypto API
 * @returns {boolean} True if supported, false otherwise
 */
export function isCryptoSupported() {
  try {
    return (
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.subtle.decrypt === 'function' &&
      typeof window.crypto.subtle.importKey === 'function'
    );
  } catch (error) {
    console.error('Crypto support check failed:', error);
    return false;
  }
}

/**
 * Convert base64 string to ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} Decoded array buffer
 * @throws {Error} If base64 string is invalid
 */
export function base64ToArrayBuffer(base64) {
  try {
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid base64 string: input must be a non-empty string');
    }

    // Remove whitespace and validate base64 format
    const cleanBase64 = base64.trim().replace(/\s/g, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      throw new Error('Invalid base64 string: contains invalid characters');
    }

    // Decode base64 to binary string
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);

    // Convert binary string to byte array
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  } catch (error) {
    console.error('Base64 to ArrayBuffer conversion failed:', error);
    throw new Error(`Failed to decode base64: ${error.message}`);
  }
}

/**
 * Validate encryption parameters
 * @param {string} aesKeyBase64 - Base64 encoded AES key (should be 256 bits / 32 bytes)
 * @param {string} ivBase64 - Base64 encoded initialization vector (should be 96 bits / 12 bytes)
 * @param {string} authTagBase64 - Base64 encoded auth tag (should be 128 bits / 16 bytes)
 * @throws {Error} If any parameter is invalid
 */
function validateEncryptionParams(aesKeyBase64, ivBase64, authTagBase64) {
  if (!aesKeyBase64) throw new Error('AES key is missing');
  if (!ivBase64) throw new Error('Initialization vector (IV) is missing');
  if (!authTagBase64) throw new Error('Authentication tag is missing');

  // Validate key length (256 bits = 32 bytes = 44 base64 chars)
  const keyBuffer = base64ToArrayBuffer(aesKeyBase64);
  if (keyBuffer.byteLength !== 32) {
    throw new Error(`Invalid AES key length: expected 32 bytes (256 bits), got ${keyBuffer.byteLength} bytes`);
  }

  // Validate IV length (96 bits = 12 bytes)
  const ivBuffer = base64ToArrayBuffer(ivBase64);
  if (ivBuffer.byteLength !== 12) {
    throw new Error(`Invalid IV length: expected 12 bytes (96 bits), got ${ivBuffer.byteLength} bytes`);
  }

  // Validate auth tag length (128 bits = 16 bytes)
  const authTagBuffer = base64ToArrayBuffer(authTagBase64);
  if (authTagBuffer.byteLength !== 16) {
    throw new Error(`Invalid auth tag length: expected 16 bytes (128 bits), got ${authTagBuffer.byteLength} bytes`);
  }
}

/**
 * Decrypt file using AES-256-GCM in the browser
 * @param {ArrayBuffer} encryptedArrayBuffer - Encrypted file data
 * @param {string} aesKeyBase64 - Base64 encoded AES-256 key
 * @param {string} ivBase64 - Base64 encoded initialization vector
 * @param {string} authTagBase64 - Base64 encoded authentication tag
 * @returns {Promise<ArrayBuffer>} Decrypted file data
 * @throws {Error} If decryption fails
 */
export async function decryptFileClientSide(
  encryptedArrayBuffer,
  aesKeyBase64,
  ivBase64,
  authTagBase64
) {
  try {
    console.log('[Decrypt] Starting client-side decryption...');
    console.log(`[Decrypt] Encrypted data size: ${(encryptedArrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

    // 1. Validate inputs
    if (!encryptedArrayBuffer || encryptedArrayBuffer.byteLength === 0) {
      throw new Error('Encrypted data is empty or invalid');
    }

    validateEncryptionParams(aesKeyBase64, ivBase64, authTagBase64);
    console.log('[Decrypt] ✓ Encryption parameters validated');

    // 2. Convert base64 keys to ArrayBuffers
    const keyBuffer = base64ToArrayBuffer(aesKeyBase64);
    const ivBuffer = base64ToArrayBuffer(ivBase64);
    const authTagBuffer = base64ToArrayBuffer(authTagBase64);
    console.log('[Decrypt] ✓ Converted base64 keys to ArrayBuffers');

    // 3. Import AES key for Web Crypto API
    console.log('[Decrypt] Importing AES-256 key...');
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM', length: 256 },
      false, // not extractable
      ['decrypt']
    );
    console.log('[Decrypt] ✓ AES key imported successfully');

    // 4. Combine encrypted data + auth tag (GCM requirement)
    // In AES-GCM, the auth tag must be appended to the ciphertext
    const encryptedData = new Uint8Array(encryptedArrayBuffer);
    const authTag = new Uint8Array(authTagBuffer);
    const combined = new Uint8Array(encryptedData.length + authTag.length);
    combined.set(encryptedData, 0);
    combined.set(authTag, encryptedData.length);
    console.log('[Decrypt] ✓ Combined encrypted data with auth tag');

    // 5. Decrypt using AES-GCM
    console.log('[Decrypt] Decrypting data with AES-256-GCM...');
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer),
        tagLength: 128, // 128 bits = 16 bytes
      },
      cryptoKey,
      combined
    );

    console.log(`[Decrypt] ✅ Decryption successful! Size: ${(decryptedBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    return decryptedBuffer;

  } catch (error) {
    console.error('[Decrypt] ❌ Decryption failed:', error);

    // Provide user-friendly error messages
    if (error.name === 'OperationError' || error.message?.includes('authentication')) {
      throw new Error('Decryption failed: Invalid encryption keys or corrupted file. Please re-upload the file.');
    } else if (error.name === 'QuotaExceededError') {
      throw new Error('Decryption failed: File too large for browser memory. Try on a device with more RAM.');
    } else if (error.message?.includes('base64')) {
      throw new Error(`Decryption failed: ${error.message}`);
    } else {
      throw new Error(`Decryption failed: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Create a downloadable blob URL from decrypted data
 * @param {ArrayBuffer} decryptedBuffer - Decrypted file data
 * @param {string} fileName - Original file name
 * @param {string} mimeType - MIME type of the file
 * @returns {string} Blob URL that can be opened or downloaded
 * @throws {Error} If blob creation fails
 */
export function createDownloadableFile(
  decryptedBuffer,
  fileName,
  mimeType = 'application/octet-stream'
) {
  try {
    if (!decryptedBuffer || decryptedBuffer.byteLength === 0) {
      throw new Error('Cannot create file from empty data');
    }

    console.log(`[Decrypt] Creating blob with MIME type: ${mimeType}`);
    const blob = new Blob([decryptedBuffer], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    console.log(`[Decrypt] ✓ Created blob URL: ${blobUrl.substring(0, 50)}...`);
    return blobUrl;

  } catch (error) {
    console.error('[Decrypt] Failed to create blob URL:', error);
    throw new Error(`Failed to create downloadable file: ${error.message}`);
  }
}

/**
 * Download encrypted file from a URL with progress tracking
 * @param {string} url - Pre-signed S3 URL
 * @param {Function} onProgress - Progress callback (percentage)
 * @returns {Promise<ArrayBuffer>} Downloaded encrypted data
 * @throws {Error} If download fails
 */
export async function downloadEncryptedFile(url, onProgress = null) {
  try {
    console.log('[Download] Starting download from S3...');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('Content-Length');
    if (!contentLength) {
      // No content length - just download without progress
      console.log('[Download] Content-Length not available, downloading without progress...');
      const arrayBuffer = await response.arrayBuffer();
      console.log(`[Download] ✓ Downloaded ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
      return arrayBuffer;
    }

    // Download with progress tracking
    const total = parseInt(contentLength, 10);
    const reader = response.body.getReader();
    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      // Report progress
      if (onProgress) {
        const progress = Math.round((receivedLength / total) * 100);
        onProgress(progress);
      }
    }

    // Combine all chunks into single ArrayBuffer
    const arrayBuffer = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      arrayBuffer.set(chunk, position);
      position += chunk.length;
    }

    console.log(`[Download] ✓ Downloaded ${(receivedLength / 1024 / 1024).toFixed(2)} MB`);
    return arrayBuffer.buffer;

  } catch (error) {
    console.error('[Download] Failed to download file:', error);
    
    if (error.name === 'TypeError' && error.message?.includes('fetch')) {
      throw new Error('Download failed: Network error. Check your internet connection.');
    } else if (error.message?.includes('HTTP')) {
      throw new Error(`Download failed: ${error.message}`);
    } else {
      throw new Error(`Download failed: ${error.message || 'Unknown error'}`);
    }
  }
}

/**
 * Estimate memory requirements for decryption
 * @param {number} fileSizeMB - File size in megabytes
 * @returns {Object} Memory estimate and recommendations
 */
export function estimateMemoryRequirements(fileSizeMB) {
  // Need at least 2x file size (encrypted + decrypted) + overhead
  const estimatedMemoryMB = fileSizeMB * 2.5;
  
  return {
    estimatedMemoryMB: Math.ceil(estimatedMemoryMB),
    recommended: fileSizeMB <= 50,
    warning: fileSizeMB > 20,
    message: 
      fileSizeMB <= 10 ? 'File size is optimal for browser decryption' :
      fileSizeMB <= 20 ? 'File size is acceptable, may take a few seconds' :
      fileSizeMB <= 50 ? 'Large file - decryption may take 10-30 seconds' :
      'File too large - may crash browser or fail. Consider using server-side decryption.'
  };
}

export default {
  isCryptoSupported,
  base64ToArrayBuffer,
  decryptFileClientSide,
  createDownloadableFile,
  downloadEncryptedFile,
  estimateMemoryRequirements,
};
