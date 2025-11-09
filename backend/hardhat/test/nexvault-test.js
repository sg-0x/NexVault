// Test Suite for NexVault Smart Contract
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NexVault Contract", function () {
  let NexVault;
  let nexvault;
  let owner;
  let addr1;
  let addr2;

  // Sample file data for testing
  const fileHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test-file-content"));
  const s3Key = "1731184301234_test-file.txt";

  /**
   * Deploy a fresh contract before each test
   * This ensures test isolation and clean state
   */
  beforeEach(async function () {
    // Get test accounts
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    NexVault = await ethers.getContractFactory("NexVault");
    nexvault = await NexVault.deploy();
    await nexvault.deployed();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(nexvault.address).to.be.properAddress;
    });
  });

  describe("File Management", function () {
    it("Should add a new file and set correct owner", async function () {
      // Add file
      await nexvault.connect(owner).addFile(fileHash, s3Key);

      // Verify file exists
      expect(await nexvault.fileExists(fileHash)).to.be.true;

      // Verify owner
      expect(await nexvault.getOwner(fileHash)).to.equal(owner.address);

      // Verify S3 key
      expect(await nexvault.getS3Key(fileHash)).to.equal(s3Key);

      // Verify owner has automatic access
      expect(await nexvault.hasAccess(fileHash, owner.address)).to.be.true;
    });

    it("Should emit FileAdded event", async function () {
      await expect(nexvault.connect(owner).addFile(fileHash, s3Key))
        .to.emit(nexvault, "FileAdded")
        .withArgs(fileHash, owner.address, s3Key);
    });

    it("Should reject duplicate file hash", async function () {
      // Add file first time
      await nexvault.connect(owner).addFile(fileHash, s3Key);

      // Try to add same file hash again
      await expect(
        nexvault.connect(owner).addFile(fileHash, "different-s3-key.txt")
      ).to.be.revertedWith("File already exists");
    });

    it("Should reject empty S3 key", async function () {
      await expect(
        nexvault.connect(owner).addFile(fileHash, "")
      ).to.be.revertedWith("S3 key cannot be empty");
    });

    it("Should return false for non-existent file", async function () {
      const nonExistentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
      expect(await nexvault.fileExists(nonExistentHash)).to.be.false;
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      // Add a file before testing access control
      await nexvault.connect(owner).addFile(fileHash, s3Key);
    });

    it("Should grant access to another address", async function () {
      // Grant access to addr1
      await nexvault.connect(owner).grantAccess(fileHash, addr1.address);

      // Verify addr1 has access
      expect(await nexvault.hasAccess(fileHash, addr1.address)).to.be.true;
    });

    it("Should emit AccessGranted event", async function () {
      await expect(nexvault.connect(owner).grantAccess(fileHash, addr1.address))
        .to.emit(nexvault, "AccessGranted")
        .withArgs(fileHash, addr1.address);
    });

    it("Should revoke access from an address", async function () {
      // Grant access first
      await nexvault.connect(owner).grantAccess(fileHash, addr1.address);
      expect(await nexvault.hasAccess(fileHash, addr1.address)).to.be.true;

      // Revoke access
      await nexvault.connect(owner).revokeAccess(fileHash, addr1.address);

      // Verify access is revoked
      expect(await nexvault.hasAccess(fileHash, addr1.address)).to.be.false;
    });

    it("Should emit AccessRevoked event", async function () {
      // Grant access first
      await nexvault.connect(owner).grantAccess(fileHash, addr1.address);

      // Revoke and check event
      await expect(nexvault.connect(owner).revokeAccess(fileHash, addr1.address))
        .to.emit(nexvault, "AccessRevoked")
        .withArgs(fileHash, addr1.address);
    });

    it("Should prevent non-owner from granting access", async function () {
      await expect(
        nexvault.connect(addr1).grantAccess(fileHash, addr2.address)
      ).to.be.revertedWith("Not authorized: only owner can grant access");
    });

    it("Should prevent non-owner from revoking access", async function () {
      // Grant access to addr1
      await nexvault.connect(owner).grantAccess(fileHash, addr1.address);

      // Try to revoke as non-owner
      await expect(
        nexvault.connect(addr1).revokeAccess(fileHash, addr2.address)
      ).to.be.revertedWith("Not authorized: only owner can revoke access");
    });

    it("Should prevent owner from revoking their own access", async function () {
      await expect(
        nexvault.connect(owner).revokeAccess(fileHash, owner.address)
      ).to.be.revertedWith("Cannot revoke owner's access");
    });

    it("Should reject granting access to zero address", async function () {
      await expect(
        nexvault.connect(owner).grantAccess(fileHash, ethers.constants.AddressZero)
      ).to.be.revertedWith("Cannot grant access to zero address");
    });

    it("Should return false for access check on non-existent file", async function () {
      const nonExistentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
      expect(await nexvault.hasAccess(nonExistentHash, addr1.address)).to.be.false;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await nexvault.connect(owner).addFile(fileHash, s3Key);
    });

    it("Should return correct S3 key", async function () {
      expect(await nexvault.getS3Key(fileHash)).to.equal(s3Key);
    });

    it("Should return correct owner", async function () {
      expect(await nexvault.getOwner(fileHash)).to.equal(owner.address);
    });

    it("Should revert when getting S3 key for non-existent file", async function () {
      const nonExistentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
      await expect(
        nexvault.getS3Key(nonExistentHash)
      ).to.be.revertedWith("File not found");
    });

    it("Should revert when getting owner for non-existent file", async function () {
      const nonExistentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("non-existent"));
      await expect(
        nexvault.getOwner(nonExistentHash)
      ).to.be.revertedWith("File not found");
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple files from different owners", async function () {
      const file1Hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("file1"));
      const file2Hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("file2"));

      // Owner adds file1
      await nexvault.connect(owner).addFile(file1Hash, "file1.txt");

      // Addr1 adds file2
      await nexvault.connect(addr1).addFile(file2Hash, "file2.txt");

      // Verify ownership
      expect(await nexvault.getOwner(file1Hash)).to.equal(owner.address);
      expect(await nexvault.getOwner(file2Hash)).to.equal(addr1.address);

      // Verify access
      expect(await nexvault.hasAccess(file1Hash, owner.address)).to.be.true;
      expect(await nexvault.hasAccess(file2Hash, addr1.address)).to.be.true;
      expect(await nexvault.hasAccess(file1Hash, addr1.address)).to.be.false;
    });

    it("Should handle multiple access grants and revocations", async function () {
      await nexvault.connect(owner).addFile(fileHash, s3Key);

      // Grant access to multiple addresses
      await nexvault.connect(owner).grantAccess(fileHash, addr1.address);
      await nexvault.connect(owner).grantAccess(fileHash, addr2.address);

      // Verify all have access
      expect(await nexvault.hasAccess(fileHash, owner.address)).to.be.true;
      expect(await nexvault.hasAccess(fileHash, addr1.address)).to.be.true;
      expect(await nexvault.hasAccess(fileHash, addr2.address)).to.be.true;

      // Revoke from addr1 only
      await nexvault.connect(owner).revokeAccess(fileHash, addr1.address);

      // Verify addr1 lost access but others retain it
      expect(await nexvault.hasAccess(fileHash, owner.address)).to.be.true;
      expect(await nexvault.hasAccess(fileHash, addr1.address)).to.be.false;
      expect(await nexvault.hasAccess(fileHash, addr2.address)).to.be.true;
    });
  });
});

