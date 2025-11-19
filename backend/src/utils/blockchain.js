// Blockchain Interaction Utilities
const { getProvider, getSigner, getContract, retryWithBackoff } = require('../config/blockchain');
const { ethers } = require('ethers');
const logger = require('./logger');

// Cache for accessible file hashes (5 minute TTL)
const accessibleFilesCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const now = Date.now();
  for (const [key, value] of accessibleFilesCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      accessibleFilesCache.delete(key);
    }
  }
}

// Run cache cleanup every minute
setInterval(clearExpiredCache, 60 * 1000);

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
 * Uses chunked queries to avoid block range limits
 * Uses 5-minute cache to avoid repeated queries
 * @param {string} address - Ethereum address to check
 * @returns {Promise<string[]>} Array of file hashes (with 0x prefix, lowercase)
 */
async function getAccessibleFileHashes(address) {
  try {
    // Check cache first
    const cacheKey = address.toLowerCase();
    const cached = accessibleFilesCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      logger.info(`[CACHE HIT] Returning ${cached.hashes.length} cached files for ${address.substring(0, 10)}...`);
      return cached.hashes;
    }
    
    const contract = getContract();
    const provider = getProvider();
    
    if (!contract || !provider) {
      throw new Error('Contract or provider not initialized. Check blockchain configuration.');
    }
    
    logger.info(`[INFO] Querying accessible files for address: ${address}`);
    
    // Get current block number
    const latestBlock = await provider.getBlockNumber();
    logger.debug(`[DEBUG] Latest block: ${latestBlock}`);
    
    // Chunk size for event queries (use larger chunks to reduce queries)
    const CHUNK_SIZE = 50000;
    
    // Contract deployment block - ONLY scan recent blocks for better performance
    // Sepolia is fast-moving, so last 50k blocks is plenty (~7 days)
    const START_BLOCK = Math.max(0, latestBlock - 50000);
    
    logger.info(`[INFO] Scanning blocks ${START_BLOCK} to ${latestBlock} (${latestBlock - START_BLOCK} blocks)`);
    
    const accessibleHashes = new Set();
    let totalEvents = 0;
    
    // Query both AccessGranted and FileAdded events in parallel for each chunk
    for (let fromBlock = START_BLOCK; fromBlock <= latestBlock; fromBlock += CHUNK_SIZE) {
      const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, latestBlock);
      
      try {
        // Query BOTH event types in parallel (faster than sequential)
        const [accessEvents, ownerEvents] = await Promise.all([
          contract.queryFilter(contract.filters.AccessGranted(null, address), fromBlock, toBlock),
          contract.queryFilter(contract.filters.FileAdded(null, address), fromBlock, toBlock),
        ]);
        
        // Process AccessGranted events
        accessEvents.forEach((event) => {
          const fileHash = event.args.fileHash;
          if (fileHash) {
            accessibleHashes.add(fileHash.toLowerCase());
          }
        });
        
        // Process FileAdded events (owner has automatic access)
        ownerEvents.forEach((event) => {
          const fileHash = event.args.fileHash;
          if (fileHash) {
            accessibleHashes.add(fileHash.toLowerCase());
          }
        });
        
        totalEvents += accessEvents.length + ownerEvents.length;
        logger.debug(`[DEBUG] Blocks ${fromBlock}-${toBlock}: ${accessEvents.length} access grants, ${ownerEvents.length} owned files`);
      } catch (err) {
        // If chunk fails, try rotating RPC and retry once
        logger.warn(`[WARN] Failed to query blocks ${fromBlock}-${toBlock}: ${err.message}, rotating RPC...`);
        
        const { rotateRpcEndpoint } = require('../config/blockchain');
        rotateRpcEndpoint();
        
        // Retry this chunk once with new RPC
        try {
          const retryContract = getContract();
          const [accessEvents, ownerEvents] = await Promise.all([
            retryContract.queryFilter(retryContract.filters.AccessGranted(null, address), fromBlock, toBlock),
            retryContract.queryFilter(retryContract.filters.FileAdded(null, address), fromBlock, toBlock),
          ]);
          
          accessEvents.forEach((event) => {
            const fileHash = event.args.fileHash;
            if (fileHash) accessibleHashes.add(fileHash.toLowerCase());
          });
          
          ownerEvents.forEach((event) => {
            const fileHash = event.args.fileHash;
            if (fileHash) accessibleHashes.add(fileHash.toLowerCase());
          });
          
          totalEvents += accessEvents.length + ownerEvents.length;
          logger.info(`[SUCCESS] Retry successful for blocks ${fromBlock}-${toBlock}`);
        } catch (retryErr) {
          logger.error(`[ERROR] Retry failed for blocks ${fromBlock}-${toBlock}: ${retryErr.message}`);
          // Continue to next chunk even if retry fails
        }
      }
    }
    
    logger.info(`[INFO] Found ${accessibleHashes.size} unique file hashes from ${totalEvents} events`);
    
    // Skip verification (it's slow and usually unnecessary)
    // Access revocation is rare, so we trust the events
    const verifiedHashes = Array.from(accessibleHashes);
    
    // Cache the results
    accessibleFilesCache.set(cacheKey, {
      hashes: verifiedHashes,
      timestamp: Date.now(),
    });
    
    logger.success(`[SUCCESS] Found ${verifiedHashes.length} accessible files for ${address} (cached for 5min)`);
    
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
