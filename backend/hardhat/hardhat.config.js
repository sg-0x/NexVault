// Hardhat Configuration for NexVault Smart Contract
require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

// Load environment variables
const INFURA_URL = process.env.INFURA_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200, // Optimize for average number of executions
      },
    },
  },
  networks: {
    // Local Hardhat network for testing
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // Sepolia testnet configuration
    sepolia: {
      url: INFURA_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  // Mocha test configuration
  mocha: {
    timeout: 40000, // 40 seconds timeout for tests
  },
};

