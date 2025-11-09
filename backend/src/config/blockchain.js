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

// Initialize Ethereum provider (Infura/Alchemy)
let provider;
let signer;
let contract;

/**
 * Initialize blockchain connection
 * This will be called when the application starts
 */
function initializeBlockchain() {
  try {
    // Validate required environment variables
    if (!INFURA_URL) {
      console.warn('⚠️  INFURA_URL not set - blockchain features will be disabled');
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

    // Create provider instance
    provider = new ethers.JsonRpcProvider(INFURA_URL);

    // Create wallet/signer from private key
    signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Initialize contract instance with ABI
    contract = new ethers.Contract(CONTRACT_ADDRESS, NEXVAULT_ABI, signer);

    console.log('✅ Blockchain provider initialized');
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
};
