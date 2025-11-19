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
 * Create provider with current RPC endpoint
 * Simpler than FallbackProvider which has network detection issues
 */
function createProvider() {
  const rpcUrl = SEPOLIA_RPC_ENDPOINTS[currentRpcIndex % SEPOLIA_RPC_ENDPOINTS.length];
  console.log(`📡 Using RPC endpoint ${currentRpcIndex + 1}/${SEPOLIA_RPC_ENDPOINTS.length}: ${rpcUrl}`);
  
  // Create a simple JsonRpcProvider with explicit network config
  return new ethers.JsonRpcProvider(rpcUrl, {
    chainId: 11155111, // Sepolia chain ID
    name: 'sepolia',
  }, {
    staticNetwork: true, // Skip network detection (faster startup)
  });
}

/**
 * Rotate to next RPC endpoint
 */
function rotateRpcEndpoint() {
  currentRpcIndex = (currentRpcIndex + 1) % SEPOLIA_RPC_ENDPOINTS.length;
  console.log(`🔄 Rotating to RPC endpoint ${currentRpcIndex + 1}/${SEPOLIA_RPC_ENDPOINTS.length}`);
  
  // Recreate provider and contract with new RPC
  provider = createProvider();
  signer = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, NEXVAULT_ABI, signer);
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry transaction with exponential backoff and RPC rotation
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
        error.message?.includes('exceed maximum block range') ||
        error.message?.includes('limited to') ||
        error.code === -32005 ||
        error.code === -32701 ||
        error.code === -32602 ||
        error.code === 'BAD_DATA';

      const isLastAttempt = attempt === maxRetries;

      if (isRateLimitError && !isLastAttempt) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`⏳ Rate limit/block range error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await sleep(delay);
        
        // Rotate to next RPC endpoint
        rotateRpcEndpoint();
        
        continue;
      }

      // Re-throw error if not rate limit or last attempt
      throw error;
    }
  }
}

/**
 * Initialize blockchain connection with simple provider rotation
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

    // Create simple provider (no FallbackProvider to avoid network detection issues)
    provider = createProvider();

    // Create wallet/signer from private key
    signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Initialize contract instance with ABI
    contract = new ethers.Contract(CONTRACT_ADDRESS, NEXVAULT_ABI, signer);

    console.log('✅ Blockchain provider initialized');
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
  rotateRpcEndpoint, // Export RPC rotation function
};
