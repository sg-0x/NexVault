// Ethereum Blockchain Configuration
const { ethers } = require('ethers');
const { INFURA_URL, CONTRACT_ADDRESS, PRIVATE_KEY } = require('./env');

// NexVault Smart Contract ABI (minimal - only functions we use)
const NEXVAULT_ABI = [
  "function addFile(bytes32 fileHash, string memory s3Key) external",
  "function grantAccess(bytes32 fileHash, address grantee) external",
  "function revokeAccess(bytes32 fileHash, address revokee) external",
  "function hasAccess(bytes32 fileHash, address who) external view returns(bool)",
  "function getS3Key(bytes32 fileHash) external view returns(string memory)",
  "function getOwner(bytes32 fileHash) external view returns(address)",
  "function fileExists(bytes32 fileHash) external view returns(bool)",
  "event FileAdded(bytes32 indexed fileHash, address indexed owner, string s3Key)",
  "event AccessGranted(bytes32 indexed fileHash, address indexed grantee)",
  "event AccessRevoked(bytes32 indexed fileHash, address indexed revokee)"
];

// Multiple RPC endpoints for Sepolia (fallback providers to avoid rate limits)
const SEPOLIA_RPC_ENDPOINTS = [
  INFURA_URL, // Primary: User's Infura endpoint
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Backup Infura (public)
  'https://rpc.sepolia.org', // Public Sepolia RPC
  'https://rpc2.sepolia.org', // Another public Sepolia RPC
  'https://ethereum-sepolia-rpc.publicnode.com', // PublicNode
  'https://1rpc.io/sepolia', // 1RPC
].filter(Boolean); // Remove undefined/null values

// Initialize Ethereum provider (Infura/Alchemy)
let provider;
let signer;
let contract;
let currentRpcIndex = 0;

/**
 * Create a FallbackProvider with multiple RPC endpoints
 * This prevents rate limiting issues by using multiple providers
 */
function createFallbackProvider() {
  const providers = SEPOLIA_RPC_ENDPOINTS.map((url, index) => ({
    provider: new ethers.JsonRpcProvider(url),
    priority: index + 1, // Lower priority = preferred
    stallTimeout: 2000, // Wait 2 seconds before trying next provider
    weight: 1,
  }));

  return new ethers.FallbackProvider(providers, null, {
    cacheTimeout: -1, // Disable caching to get real-time data
  });
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry transaction with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in milliseconds (doubles each retry)
 */
async function retryWithBackoff(fn, maxRetries = 5, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimitError = 
        error.message?.includes('Too Many Requests') ||
        error.message?.includes('429') ||
        error.code === -32005 ||
        error.code === 'BAD_DATA';

      const isLastAttempt = attempt === maxRetries;

      if (isRateLimitError && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`⏳ Rate limit hit (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await sleep(delay);
        
        // Try next RPC endpoint
        currentRpcIndex = (currentRpcIndex + 1) % SEPOLIA_RPC_ENDPOINTS.length;
        console.log(`🔄 Switching to RPC endpoint ${currentRpcIndex + 1}/${SEPOLIA_RPC_ENDPOINTS.length}`);
        
        continue;
      }

      // Re-throw error if not rate limit or last attempt
      throw error;
    }
  }
}

/**
 * Initialize blockchain connection with fallback providers
 * This will be called when the application starts
 */
function initializeBlockchain() {
  try {
    // Validate required environment variables
    if (!INFURA_URL && SEPOLIA_RPC_ENDPOINTS.length === 0) {
      console.warn('⚠️  No RPC URLs configured - blockchain features will be disabled');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      console.warn('⚠️  CONTRACT_ADDRESS not set - blockchain features will be disabled');
      return;
    }

    if (!PRIVATE_KEY) {
      console.warn('⚠️  PRIVATE_KEY not set - blockchain features will be disabled');
      return;
    }

    // Create fallback provider with multiple RPC endpoints
    provider = createFallbackProvider();

    // Create wallet/signer from private key
    signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Initialize contract instance with ABI
    contract = new ethers.Contract(CONTRACT_ADDRESS, NEXVAULT_ABI, signer);

    console.log('✅ Blockchain provider initialized with FallbackProvider');
    console.log(`📡 Available RPC endpoints: ${SEPOLIA_RPC_ENDPOINTS.length}`);
    console.log(`📄 Contract address: ${CONTRACT_ADDRESS}`);
    console.log(`👤 Signer address: ${signer.address}`);
  } catch (error) {
    console.error('❌ Blockchain initialization failed:', error.message);
  }
}

module.exports = {
  initializeBlockchain,
  getProvider: () => provider,
  getSigner: () => signer,
  getContract: () => contract,
  retryWithBackoff, // Export retry utility for use in controllers
};
