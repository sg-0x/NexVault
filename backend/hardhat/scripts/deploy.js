// Deployment Script for NexVault Smart Contract
const hre = require("hardhat");

/**
 * Main deployment function
 * Deploys the NexVault contract to the configured network
 */
async function main() {
  console.log("🚀 Starting NexVault contract deployment...\n");

  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${hre.ethers.utils.formatEther(balance)} ETH\n`);

  // Verify sufficient balance for deployment
  if (balance.eq(0)) {
    console.error("❌ Error: Deployer account has zero balance!");
    console.error("Please fund the account with test ETH before deploying.");
    process.exit(1);
  }

  // Get contract factory
  console.log("📝 Compiling contract...");
  const NexVault = await hre.ethers.getContractFactory("NexVault");

  // Deploy contract
  console.log("⏳ Deploying contract to network...");
  const nexvault = await NexVault.deploy();

  // Wait for deployment to complete
  await nexvault.deployed();

  console.log("\n✅ Contract deployed successfully!");
  console.log("═".repeat(60));
  console.log(`📍 Contract Address: ${nexvault.address}`);
  console.log(`🔗 Deployment Transaction: ${nexvault.deployTransaction.hash}`);
  console.log("═".repeat(60));

  // Additional information for Sepolia deployment
  if (network.name === "sepolia") {
    console.log("\n🔍 Verify contract on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${nexvault.address}`);
  }

  // Instructions for next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Add it to your backend .env file:");
  console.log(`   CONTRACT_ADDRESS=${nexvault.address}`);
  console.log("3. Restart your backend server");
  console.log("4. Test file upload with blockchain integration\n");

  // Wait for a few confirmations on live networks
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("⏳ Waiting for block confirmations...");
    await nexvault.deployTransaction.wait(3);
    console.log("✅ Contract confirmed on-chain!\n");
  }

  return nexvault.address;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exitCode = 1;
  });

