// src/services/api.js
import axios from 'axios';
import { auth } from '../firebase/config';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Get Firebase ID token for authenticated requests
 */
async function getAuthHeader() {
  const user = auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}` };
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return {};
    }
  }
  return {};
}

/**
 * Upload file to backend
 * @param {File} file - File object to upload
 * @param {Function} onProgress - Progress callback (receives percentage)
 * @returns {Promise<Object>} Upload response with metadata
 */
export async function uploadFile(file, onProgress = null) {
  try {
    const headers = await getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE}/api/upload`, formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Upload failed');
  }
}

/**
 * Grant access to a file for a specific address
 * @param {string} fileHash - File hash (SHA-256)
 * @param {string} grantee - Ethereum address to grant access to
 * @returns {Promise<Object>} Grant response with txHash
 */
export async function grantAccess(fileHash, grantee) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(
      `${API_BASE}/api/access/grant`,
      { fileHash, grantee },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Grant access failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Grant access failed');
  }
}

/**
 * Revoke access to a file for a specific address
 * @param {string} fileHash - File hash (SHA-256)
 * @param {string} grantee - Ethereum address to revoke access from
 * @returns {Promise<Object>} Revoke response with txHash
 */
export async function revokeAccess(fileHash, grantee) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(
      `${API_BASE}/api/access/revoke`,
      { fileHash, grantee },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Revoke access failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Revoke access failed');
  }
}

/**
 * Download file from backend
 * @param {string} key - S3 key of the file
 * @returns {Promise<Object>} Download URL response
 */
export async function getDownloadUrl(key) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(`${API_BASE}/api/download/${key}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Get download URL failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to get download URL');
  }
}

/**
 * Download and decrypt file from backend
 * @param {string} key - S3 key
 * @param {string} aesKey - AES encryption key (base64)
 * @param {string} iv - Initialization vector (base64)
 * @param {string} authTag - Authentication tag (base64)
 * @returns {Promise<Blob>} Decrypted file blob
 */
export async function downloadAndDecrypt(key, aesKey, iv, authTag) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(
      `${API_BASE}/api/download/decrypt`,
      { key, aesKey, iv, authTag },
      {
        headers,
        responseType: 'blob',
      }
    );
    return response.data;
  } catch (error) {
    console.error('Download and decrypt failed:', error.response?.data || error.message);
    throw new Error('Failed to download and decrypt file');
  }
}

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  try {
    const response = await axios.get(`${API_BASE}/api/health`);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error('Backend is not reachable');
  }
}

/**
 * Fetch all files uploaded by the authenticated user
 * @returns {Promise<Array>} Array of file objects from Firestore
 */
export async function fetchUserFiles() {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(`${API_BASE}/api/files`, { headers });
    return response.data.files || [];
  } catch (error) {
    console.error('Fetch user files failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch files');
  }
}

/**
 * Fetch a specific file by ID
 * @param {string} fileId - Firestore document ID
 * @returns {Promise<Object>} File object
 */
export async function fetchFileById(fileId) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(`${API_BASE}/api/files/${fileId}`, { headers });
    return response.data.file;
  } catch (error) {
    console.error('Fetch file by ID failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch file');
  }
}

/**
 * Delete a file metadata from Firestore
 * @param {string} fileId - Firestore document ID
 * @returns {Promise<Object>} Delete response
 */
export async function deleteFileMetadata(fileId) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.delete(`${API_BASE}/api/files/${fileId}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Delete file failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to delete file');
  }
}

/**
 * Link a wallet address to user account
 * @param {string} address - Ethereum wallet address
 * @returns {Promise<Object>} Link response
 */
export async function linkWalletAddress(address) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(
      `${API_BASE}/api/user/wallet/link`,
      { address },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Link wallet failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to link wallet address');
  }
}

/**
 * Unlink a wallet address from user account
 * @param {string} address - Ethereum wallet address
 * @returns {Promise<Object>} Unlink response
 */
export async function unlinkWalletAddress(address) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(
      `${API_BASE}/api/user/wallet/unlink`,
      { address },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Unlink wallet failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to unlink wallet address');
  }
}

/**
 * Get user's linked wallet addresses
 * @returns {Promise<Array>} Array of wallet addresses
 */
export async function getWalletAddresses() {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(`${API_BASE}/api/user/wallet`, { headers });
    return response.data.walletAddresses || [];
  } catch (error) {
    console.error('Get wallet addresses failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch wallet addresses');
  }
}

/**
 * Get files accessible by a wallet address
 * @param {string} address - Ethereum wallet address
 * @returns {Promise<Array>} Array of accessible files
 */
export async function getAccessibleFiles(address) {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(`${API_BASE}/api/access/files/${address}`, { headers });
    return response.data.files || [];
  } catch (error) {
    console.error('Get accessible files failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error || 'Failed to fetch accessible files');
  }
}

export default {
  uploadFile,
  grantAccess,
  revokeAccess,
  getDownloadUrl,
  downloadAndDecrypt,
  healthCheck,
  fetchUserFiles,
  fetchFileById,
  deleteFileMetadata,
  linkWalletAddress,
  unlinkWalletAddress,
  getWalletAddresses,
  getAccessibleFiles,
};

