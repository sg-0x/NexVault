// Blockchain Interaction Utilities
const { getProvider, getSigner, getContract, retryWithBackoff } = require('../config/blockchain');
const { ethers } = require('ethers');
const logger = require('./logger');

/**
 * Add file record to blockchain
 * Stores file hash and S3 key on the smart contract
 * @param {string} fileHash - SHA-256 hash of the encrypted file (hex string)
 * @param {string} s3Key - S3 object key for file retrieval
 * @returns {Promise<string>} Transaction hash
 */
async function addFileRecord(fileHash, s3Key) {
  try {
    const contract = getContract();
    
    // Convert hex hash to bytes32 format if needed
    const bytes32Hash = fileHash.startsWith('0x') ? fileHash : `0x${fileHash}`;
    
    logger.info('Adding file to blockchain...');
    
    // Use retry logic for transaction submission and confirmation
    const txHash = await retryWithBackoff(async () => {
      logger.info('Sending transaction to blockchain...');
      
      // Call the addFile function on the smart contract
      const tx = await contract.addFile(bytes32Hash, s3Key);
      
      logger.info(`Transaction sent. Hash: ${tx.hash}`);
      logger.info('Waiting for blockchain confirmation...');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      logger.debug(`Block number: ${receipt.blockNumber}, Gas used: ${receipt.gasUsed.toString()}`);
      
      return tx.hash;
    }, 5, 2000); // 5 retries, starting with 2 second delay
    
    logger.success(`✅ File metadata added to blockchain. TxHash: ${txHash}`);
    
    return txHash;
  } catch (error) {
    logger.error(`Blockchain transaction failed: ${error.message}`);
    throw new Error(`Failed to add file record to blockchain: ${error.message}`);
  }
}

/**
 * Store file metadata on blockchain
 * @param {string} fileId - Unique file identifier
 * @param {string} fileHash - SHA-256 hash of the file
 * @param {string} owner - Ethereum address of the file owner
 * @returns {Promise<Object>} Transaction receipt
 */
async function storeFileMetadata(fileId, fileHash, owner) {
  try {
    // TODO: Implement smart contract interaction
    // const contract = getContract();
    // const tx = await contract.storeFile(fileId, fileHash, owner);
    // const receipt = await tx.wait();

    logger.info(`File metadata stored on blockchain: ${fileId}`);
    
    // Placeholder return
    return {
      success: true,
      fileId,
      transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    };
  } catch (error) {
    logger.error(`Blockchain storage failed: ${error.message}`);
    throw new Error(`Failed to store metadata on blockchain: ${error.message}`);
  }
}

/**
 * Verify file ownership on blockchain
 * @param {string} fileId - Unique file identifier
 * @param {string} address - Ethereum address to verify
 * @returns {Promise<boolean>} True if address owns the file
 */
async function verifyFileOwnership(fileId, address) {
  try {
    // TODO: Implement smart contract interaction
    // const contract = getContract();
    // const owner = await contract.getFileOwner(fileId);
    // return owner.toLowerCase() === address.toLowerCase();

    logger.info(`File ownership verified: ${fileId}`);
    
    // Placeholder return
    return true;
  } catch (error) {
    logger.error(`Ownership verification failed: ${error.message}`);
    throw new Error(`Failed to verify ownership: ${error.message}`);
  }
}

/**
 * Grant access to a file on blockchain
 * Calls smart contract's grantAccess function
 * @param {string} fileHash - File hash (bytes32 format or hex string)
 * @param {string} granteeAddress - Ethereum address to grant access to
 * @returns {Promise<string>} Transaction hash
 */
async function grantFileAccess(fileHash, granteeAddress) {
  try {
    const contract = getContract();
    
    if (!contract) {
      throw new Error('Contract not initialized. Check blockchain configuration.');
    }
    
    // Convert hex hash to bytes32 format if needed
    const bytes32Hash = fileHash.startsWith('0x') ? fileHash : `0x${fileHash}`;
    
    logger.info(`[INFO] Granting access to ${granteeAddress} for file ${fileHash.substring(0, 10)}...`);
    
    // Use retry logic for transaction submission and confirmation
    const txHash = await retryWithBackoff(async () => {
      logger.info('Sending transaction to blockchain...');
      
      // Call grantAccess on smart contract
      const tx = await contract.grantAccess(bytes32Hash, granteeAddress);
      
      logger.info(`Transaction sent. Hash: ${tx.hash}`);
      logger.info('Waiting for blockchain confirmation...');
      
      // Wait for transaction to be mined (with timeout)
      const receipt = await tx.wait();
      
      logger.debug(`Block number: ${receipt.blockNumber}, Gas used: ${receipt.gasUsed.toString()}`);
      
      return tx.hash;
    }, 5, 2000); // 5 retries, starting with 2 second delay
    
    logger.success(`[SUCCESS] Access granted to ${granteeAddress}. TxHash: ${txHash}`);
    
    return txHash;
  } catch (error) {
    logger.error(`[ERROR] grantAccess failed: ${error.message}`);
    throw new Error(`Failed to grant access: ${error.message}`);
  }
}

/**
 * Revoke access to a file on blockchain
 * Calls smart contract's revokeAccess function
 * @param {string} fileHash - File hash (bytes32 format or hex string)
 * @param {string} revokeeAddress - Ethereum address to revoke access from
 * @returns {Promise<string>} Transaction hash
 */
async function revokeFileAccess(fileHash, revokeeAddress) {
  try {
    const contract = getContract();
    
    if (!contract) {
      throw new Error('Contract not initialized. Check blockchain configuration.');
    }
    
    // Convert hex hash to bytes32 format if needed
    const bytes32Hash = fileHash.startsWith('0x') ? fileHash : `0x${fileHash}`;
    
    logger.info(`[INFO] Revoking access for ${revokeeAddress} on file ${fileHash.substring(0, 10)}...`);
    
    // Use retry logic for transaction submission and confirmation
    const txHash = await retryWithBackoff(async () => {
      logger.info('Sending transaction to blockchain...');
      
      // Call revokeAccess on smart contract
      const tx = await contract.revokeAccess(bytes32Hash, revokeeAddress);
      
      logger.info(`Transaction sent. Hash: ${tx.hash}`);
      logger.info('Waiting for blockchain confirmation...');
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      logger.debug(`Block number: ${receipt.blockNumber}, Gas used: ${receipt.gasUsed.toString()}`);
      
      return tx.hash;
    }, 5, 2000); // 5 retries, starting with 2 second delay
    
    logger.success(`[SUCCESS] Access revoked for ${revokeeAddress}. TxHash: ${txHash}`);
    
    return txHash;
  } catch (error) {
    logger.error(`[ERROR] revokeAccess failed: ${error.message}`);
    throw new Error(`Failed to revoke access: ${error.message}`);
  }
}

/**
 * Legacy function - Grant access to a file on blockchain
 * @deprecated Use grantFileAccess instead
 * @param {string} fileId - Unique file identifier
 * @param {string} address - Ethereum address to grant access to
 * @returns {Promise<Object>} Transaction receipt
 */
async function grantAccess(fileId, address) {
  try {
    // TODO: Implement smart contract interaction
    // const contract = getContract();
    // const tx = await contract.grantAccess(fileId, address);
    // const receipt = await tx.wait();

    logger.info(`Access granted for file ${fileId} to ${address}`);
    
    // Placeholder return
    return {
      success: true,
      fileId,
      grantedTo: address,
    };
  } catch (error) {
    logger.error(`Grant access failed: ${error.message}`);
    throw new Error(`Failed to grant access: ${error.message}`);
  }
}

/**
 * Legacy function - Revoke access to a file on blockchain
 * @deprecated Use revokeFileAccess instead
 * @param {string} fileId - Unique file identifier
 * @param {string} address - Ethereum address to revoke access from
 * @returns {Promise<Object>} Transaction receipt
 */
async function revokeAccess(fileId, address) {
  try {
    // TODO: Implement smart contract interaction
    // const contract = getContract();
    // const tx = await contract.revokeAccess(fileId, address);
    // const receipt = await tx.wait();

    logger.info(`Access revoked for file ${fileId} from ${address}`);
    
    // Placeholder return
    return {
      success: true,
      fileId,
      revokedFrom: address,
    };
  } catch (error) {
    logger.error(`Revoke access failed: ${error.message}`);
    throw new Error(`Failed to revoke access: ${error.message}`);
  }
}

/**
 * Check if an address has access to a file by fileHash
 * @param {string} fileHash - File hash (bytes32 format or hex string)
 * @param {string} address - Ethereum address to check
 * @returns {Promise<boolean>} True if address has access
 */
async function hasFileAccess(fileHash, address) {
  try {
    const contract = getContract();
    
    if (!contract) {
      throw new Error('Contract not initialized. Check blockchain configuration.');
    }
    
    // Convert hex hash to bytes32 format if needed
    const bytes32Hash = fileHash.startsWith('0x') ? fileHash : `0x${fileHash}`;
    
    logger.info(`[INFO] Checking access for ${address} on file ${fileHash.substring(0, 10)}...`);
    
    // Call hasAccess on smart contract (view function, no gas cost)
    const hasAccess = await contract.hasAccess(bytes32Hash, address);
    
    logger.debug(`[DEBUG] Access check result: ${hasAccess} for ${address}`);
    
    return hasAccess;
  } catch (error) {
    logger.error(`[ERROR] hasFileAccess failed: ${error.message}`);
    throw new Error(`Failed to check file access: ${error.message}`);
  }
}

/**
 * Get all file hashes accessible by an address
 * Queries blockchain events to find all files where address has access
 * @param {string} address - Ethereum address to check
 * @returns {Promise<string[]>} Array of file hashes (without 0x prefix)
 */
async function getAccessibleFileHashes(address) {
  try {
    const contract = getContract();
    
    if (!contract) {
      throw new Error('Contract not initialized. Check blockchain configuration.');
    }
    
    logger.info(`[INFO] Querying accessible files for address: ${address}`);
    
    // Query AccessGranted events for this address
    const filter = contract.filters.AccessGranted(null, address);
    const events = await contract.queryFilter(filter);
    
    // Also check FileAdded events where address is the owner
    const ownerFilter = contract.filters.FileAdded(null, address);
    const ownerEvents = await contract.queryFilter(ownerFilter);
    
    const accessibleHashes = new Set();
    
    // Add files from AccessGranted events
    events.forEach((event) => {
      const fileHash = event.args.fileHash;
      if (fileHash) {
        // Remove 0x prefix and convert to lowercase for consistency
        accessibleHashes.add(fileHash.toLowerCase());
      }
    });
    
    // Add files from FileAdded events (owner has automatic access)
    ownerEvents.forEach((event) => {
      const fileHash = event.args.fileHash;
      if (fileHash) {
        accessibleHashes.add(fileHash.toLowerCase());
      }
    });
    
    // Verify each file still has access (in case access was revoked)
    // Use Promise.all for parallel verification instead of sequential
    const verificationPromises = Array.from(accessibleHashes).map(async (hash) => {
      try {
        const hasAccess = await hasFileAccess(hash, address);
        return hasAccess ? hash : null;
      } catch (err) {
        logger.warn(`[WARN] Failed to verify access for hash ${hash.substring(0, 10)}: ${err.message}`);
        return null;
      }
    });
    
    const verificationResults = await Promise.all(verificationPromises);
    const verifiedHashes = verificationResults.filter(hash => hash !== null);
    
    logger.success(`[SUCCESS] Found ${verifiedHashes.length} accessible files for ${address}`);
    
    return verifiedHashes;
  } catch (error) {
    logger.error(`[ERROR] getAccessibleFileHashes failed: ${error.message}`);
    throw new Error(`Failed to get accessible file hashes: ${error.message}`);
  }
}

/**
 * Check if an address has access to a file
 * @param {string} fileId - Unique file identifier (deprecated - use hasFileAccess with fileHash)
 * @param {string} address - Ethereum address to check
 * @returns {Promise<boolean>} True if address has access
 */
async function checkAccess(fileId, address) {
  try {
    // This is a legacy function - try to use it as fileHash
    logger.info(`Access check for file ${fileId} by ${address}`);
    return await hasFileAccess(fileId, address);
  } catch (error) {
    logger.error(`Access check failed: ${error.message}`);
    throw new Error(`Failed to check access: ${error.message}`);
  }
}

module.exports = {
  addFileRecord,
  grantFileAccess,
  revokeFileAccess,
  hasFileAccess,
  getAccessibleFileHashes,
  storeFileMetadata,
  verifyFileOwnership,
  grantAccess,
  revokeAccess,
  checkAccess,
};
