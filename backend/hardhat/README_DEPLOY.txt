================================================================================
                    NexVault Smart Contract Deployment Guide
================================================================================

This guide walks you through deploying the NexVault smart contract to Ethereum
Sepolia testnet and integrating it with your backend.

================================================================================
PREREQUISITES
================================================================================

1. Node.js (v16 or higher)
2. npm or yarn
3. MetaMask wallet
4. Infura or Alchemy account
5. Sepolia test ETH (from faucet)

================================================================================
PART 1: LOCAL TESTING (OPTIONAL BUT RECOMMENDED)
================================================================================

Step 1: Install Dependencies
-----------------------------
cd nexvault/backend/hardhat
npm install

Step 2: Compile Contract
-------------------------
npm run compile

Expected output:
  ✓ Compiled 1 Solidity file successfully

Step 3: Run Local Hardhat Node (Terminal A)
-------------------------------------------
npm run node

This starts a local blockchain at http://127.0.0.1:8545
Leave this terminal running.

Step 4: Run Tests (Terminal B)
-------------------------------
npx hardhat test

Expected output:
  NexVault Contract
    ✓ Should deploy successfully
    ✓ Should add a new file and set correct owner
    ✓ Should grant access to another address
    ✓ Should revoke access from an address
    ... (more tests)

  20 passing (2s)

Step 5: Deploy to Local Node (Optional)
---------------------------------------
npm run deploy:local

Expected output:
  📍 Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3

================================================================================
PART 2: DEPLOY TO SEPOLIA TESTNET
================================================================================

Step 1: Create/Setup Test Wallet
---------------------------------
1. Open MetaMask
2. Create a NEW account (don't use your main wallet!)
3. Name it "NexVault Test" or similar
4. Click Account Details → Export Private Key
5. Copy the private key (starts with 0x)

Step 2: Get Infura Project ID
------------------------------
1. Go to https://infura.io
2. Sign up / Log in
3. Create New Project → Name: "NexVault"
4. Select "Ethereum" as product
5. In Project Settings, find "Sepolia" endpoint
6. Copy the full URL:
   https://sepolia.infura.io/v3/YOUR_PROJECT_ID

Alternative: Use Alchemy
1. Go to https://www.alchemy.com
2. Create account and new app
3. Select "Ethereum" → "Sepolia"
4. Copy the HTTPS endpoint URL

Step 3: Configure Environment
------------------------------
cd nexvault/backend/hardhat
cp .env.example .env
nano .env  (or use any text editor)

Add your values:
INFURA_URL=https://sepolia.infura.io/v3/YOUR_ACTUAL_PROJECT_ID
PRIVATE_KEY=0xyour_actual_private_key_here

Save and close the file.

Step 4: Fund Your Wallet
-------------------------
You need Sepolia test ETH to deploy the contract (~0.01 ETH should be enough).

Faucets:
- https://sepoliafaucet.com/
- https://faucet.sepolia.dev/
- https://sepolia-faucet.pk910.de/

1. Copy your test wallet address from MetaMask
2. Visit one of the faucets above
3. Paste your address and request test ETH
4. Wait for transaction to confirm (check on https://sepolia.etherscan.io/)

Step 5: Deploy Contract
------------------------
npm run deploy:sepolia

Expected output:
========================================
🚀 Starting NexVault contract deployment...

📡 Network: sepolia (Chain ID: 11155111)
👤 Deploying with account: 0xYourAddress
💰 Account balance: 0.05 ETH

⏳ Deploying contract to network...

✅ Contract deployed successfully!
════════════════════════════════════════════════════════════
📍 Contract Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEaC
🔗 Deployment Transaction: 0xabc123...
════════════════════════════════════════════════════════════

🔍 Verify contract on Etherscan:
   https://sepolia.etherscan.io/address/0x742d35...

📋 Next Steps:
1. Copy the contract address above
2. Add it to your backend .env file:
   CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEaC
3. Restart your backend server
========================================

Step 6: Verify on Etherscan (Optional)
---------------------------------------
1. Go to the Etherscan URL printed above
2. You should see your contract deployed
3. You can view transactions and contract state

Step 7: Update Backend Configuration
-------------------------------------
cd ../  (go to nexvault/backend/)
nano .env  (or use any text editor)

Add the deployed contract address:
CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEaC

Also ensure these values are set:
INFURA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0xyour_private_key_here

Save the file.

Step 8: Restart Backend Server
-------------------------------
npm run dev

Expected output:
  ✅ Blockchain provider initialized
  🚀 NexVault Backend Server started successfully
  📡 Server running on http://localhost:5000

================================================================================
PART 3: TESTING THE INTEGRATION
================================================================================

Step 1: Upload a File
----------------------
curl -X POST http://localhost:5000/api/upload \
  -F "file=@test.txt"

The backend will now:
1. Encrypt the file
2. Upload to S3
3. Store the file hash on blockchain ✨ NEW!
4. Return metadata including transaction hash

Expected response:
{
  "success": true,
  "message": "File uploaded successfully",
  "metadata": {
    "fileName": "test.txt",
    "s3Key": "1731184301234_test.txt",
    "hash": "0xabc123...",
    "blockchainTxHash": "0xdef456...",  ← NEW
    "blockchainConfirmed": true          ← NEW
  }
}

Step 2: Verify on Blockchain
-----------------------------
1. Copy the transaction hash from the response
2. Visit: https://sepolia.etherscan.io/tx/0xdef456...
3. You should see the transaction with:
   - Function: addFile
   - Status: Success
   - Event logs showing FileAdded

================================================================================
TROUBLESHOOTING
================================================================================

Problem: "Insufficient funds for gas"
Solution: Fund your wallet with more Sepolia test ETH from faucets

Problem: "Invalid project ID" or "Unauthorized"
Solution: Check your INFURA_URL is correct and includes /v3/PROJECT_ID

Problem: "Private key must be 32 bytes"
Solution: Ensure your PRIVATE_KEY starts with 0x and is 66 characters total

Problem: Contract deployed but backend can't connect
Solution: 
  1. Verify CONTRACT_ADDRESS in backend/.env matches deployed address
  2. Verify INFURA_URL is the same in both hardhat/.env and backend/.env
  3. Restart backend server after changing .env

Problem: "Nonce too high" error
Solution: Reset your MetaMask account (Settings → Advanced → Reset Account)

Problem: Tests fail
Solution: Make sure hardhat node is running (npm run node) before running tests

================================================================================
GAS OPTIMIZATION NOTES
================================================================================

The NexVault contract is optimized for gas efficiency:
- Stores minimal data on-chain (hash + S3 pointer only)
- Uses events for off-chain indexing
- Optimizer enabled (200 runs)
- Typical deployment cost: ~0.002-0.005 ETH
- Typical addFile call: ~0.0001-0.0003 ETH

================================================================================
SECURITY BEST PRACTICES
================================================================================

1. NEVER commit .env files to git
2. NEVER use mainnet for testing
3. NEVER share your private keys
4. Use separate test wallets for development
5. Verify contract addresses before using
6. Keep private keys encrypted in production
7. Use hardware wallets for mainnet deployments
8. Consider multisig for production contract ownership

================================================================================
PRODUCTION DEPLOYMENT CHECKLIST
================================================================================

For production (mainnet) deployment:

[ ] Audit smart contract code
[ ] Test extensively on testnet
[ ] Use hardware wallet for deployment
[ ] Verify contract on Etherscan
[ ] Document contract address
[ ] Set up monitoring/alerts
[ ] Configure backup RPC providers
[ ] Implement key rotation strategy
[ ] Set up multisig for contract ownership
[ ] Test emergency procedures

================================================================================
USEFUL COMMANDS
================================================================================

Compile contract:
  npm run compile

Run tests:
  npx hardhat test

Start local node:
  npm run node

Deploy locally:
  npm run deploy:local

Deploy to Sepolia:
  npm run deploy:sepolia

Clean build artifacts:
  npm run clean

Check contract size:
  npx hardhat size-contracts

================================================================================
ADDITIONAL RESOURCES
================================================================================

Hardhat Documentation:
  https://hardhat.org/docs

Sepolia Faucets:
  - https://sepoliafaucet.com/
  - https://faucet.sepolia.dev/

Sepolia Block Explorer:
  https://sepolia.etherscan.io/

Infura:
  https://infura.io

Alchemy:
  https://www.alchemy.com

OpenZeppelin (Security):
  https://docs.openzeppelin.com/

================================================================================
MANUAL SETUP SUMMARY
================================================================================

3 CRITICAL MANUAL STEPS REQUIRED:

1. ✅ Get INFURA_URL
   - Sign up at infura.io
   - Create project
   - Copy Sepolia endpoint URL

2. ✅ Get PRIVATE_KEY
   - Create test wallet in MetaMask
   - Export private key
   - NEVER use main wallet!

3. ✅ Fund with Sepolia Test ETH
   - Visit Sepolia faucet
   - Request test ETH (0.05 ETH recommended)
   - Wait for confirmation

After completing these steps and deploying:
4. ✅ Copy CONTRACT_ADDRESS to backend/.env
5. ✅ Restart backend server

================================================================================
SUPPORT
================================================================================

For issues or questions:
- Check Hardhat docs: https://hardhat.org/docs
- Ethereum Stack Exchange: https://ethereum.stackexchange.com/
- Hardhat Discord: https://hardhat.org/discord

================================================================================
END OF DEPLOYMENT GUIDE
================================================================================

