// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NexVault
 * @notice On-chain metadata and access control for encrypted cloud files
 * @dev Stores file identifiers (SHA-256 hash) with S3 pointers and manages access permissions
 * 
 * Key Features:
 * - Store file metadata (hash, S3 key, owner)
 * - Grant/revoke access to specific addresses
 * - Minimal on-chain storage for gas efficiency
 * - Event emission for off-chain indexing
 * 
 * Security:
 * - Only file owner can grant/revoke access
 * - File hash uniqueness enforced
 * - Owner automatically has access to their files
 */
contract NexVault {
    
    /**
     * @dev Structure to store file metadata and access control
     * @param owner Address that uploaded/owns the file
     * @param s3Key S3 object key for retrieving encrypted file from cloud storage
     * @param exists Flag to check if file has been registered
     * @param access Mapping of addresses to their access permissions
     */
    struct FileInfo {
        address owner;
        string s3Key;
        bool exists;
        mapping(address => bool) access;
    }

    // Mapping from file hash (bytes32) to file information
    mapping(bytes32 => FileInfo) private files;

    /**
     * @dev Emitted when a new file is registered on-chain
     * @param fileHash SHA-256 hash of the encrypted file
     * @param owner Address of the file owner
     * @param s3Key S3 object key for file retrieval
     */
    event FileAdded(
        bytes32 indexed fileHash,
        address indexed owner,
        string s3Key
    );

    /**
     * @dev Emitted when access is granted to an address
     * @param fileHash SHA-256 hash of the file
     * @param grantee Address receiving access
     */
    event AccessGranted(
        bytes32 indexed fileHash,
        address indexed grantee
    );

    /**
     * @dev Emitted when access is revoked from an address
     * @param fileHash SHA-256 hash of the file
     * @param revokee Address losing access
     */
    event AccessRevoked(
        bytes32 indexed fileHash,
        address indexed revokee
    );

    /**
     * @notice Register a new file on the blockchain
     * @dev Only allows registration if file hash doesn't exist
     * @param fileHash SHA-256 hash of the encrypted file (computed off-chain)
     * @param s3Key S3 object key where the encrypted file is stored
     * 
     * Requirements:
     * - File hash must not already exist
     * - s3Key must not be empty
     * 
     * Effects:
     * - Creates new file entry
     * - Sets caller as owner
     * - Grants owner automatic access
     * - Emits FileAdded event
     */
    function addFile(bytes32 fileHash, string memory s3Key) external {
        require(!files[fileHash].exists, "File already exists");
        require(bytes(s3Key).length > 0, "S3 key cannot be empty");

        files[fileHash].owner = msg.sender;
        files[fileHash].s3Key = s3Key;
        files[fileHash].exists = true;
        files[fileHash].access[msg.sender] = true; // Owner has automatic access

        emit FileAdded(fileHash, msg.sender, s3Key);
    }

    /**
     * @notice Grant access to a file for a specific address
     * @dev Only the file owner can grant access
     * @param fileHash SHA-256 hash of the file
     * @param grantee Address to grant access to
     * 
     * Requirements:
     * - File must exist
     * - Caller must be the file owner
     * - Grantee must not be zero address
     * 
     * Effects:
     * - Grants access permission to grantee
     * - Emits AccessGranted event
     */
    function grantAccess(bytes32 fileHash, address grantee) external {
        require(files[fileHash].exists, "File not found");
        require(msg.sender == files[fileHash].owner, "Not authorized: only owner can grant access");
        require(grantee != address(0), "Cannot grant access to zero address");

        files[fileHash].access[grantee] = true;
        emit AccessGranted(fileHash, grantee);
    }

    /**
     * @notice Revoke access to a file from a specific address
     * @dev Only the file owner can revoke access
     * @param fileHash SHA-256 hash of the file
     * @param revokee Address to revoke access from
     * 
     * Requirements:
     * - File must exist
     * - Caller must be the file owner
     * - Cannot revoke owner's own access
     * 
     * Effects:
     * - Removes access permission from revokee
     * - Emits AccessRevoked event
     */
    function revokeAccess(bytes32 fileHash, address revokee) external {
        require(files[fileHash].exists, "File not found");
        require(msg.sender == files[fileHash].owner, "Not authorized: only owner can revoke access");
        require(revokee != files[fileHash].owner, "Cannot revoke owner's access");

        files[fileHash].access[revokee] = false;
        emit AccessRevoked(fileHash, revokee);
    }

    /**
     * @notice Check if an address has access to a file
     * @dev Public view function for access verification
     * @param fileHash SHA-256 hash of the file
     * @param who Address to check access for
     * @return bool True if address has access, false otherwise
     */
    function hasAccess(bytes32 fileHash, address who) external view returns (bool) {
        if (!files[fileHash].exists) {
            return false;
        }
        return files[fileHash].access[who];
    }

    /**
     * @notice Get the S3 key for a file
     * @dev Returns the S3 object key for retrieving the encrypted file
     * @param fileHash SHA-256 hash of the file
     * @return string S3 object key
     * 
     * Requirements:
     * - File must exist
     */
    function getS3Key(bytes32 fileHash) external view returns (string memory) {
        require(files[fileHash].exists, "File not found");
        return files[fileHash].s3Key;
    }

    /**
     * @notice Get the owner of a file
     * @dev Returns the address that registered the file
     * @param fileHash SHA-256 hash of the file
     * @return address Owner's address
     * 
     * Requirements:
     * - File must exist
     */
    function getOwner(bytes32 fileHash) external view returns (address) {
        require(files[fileHash].exists, "File not found");
        return files[fileHash].owner;
    }

    /**
     * @notice Check if a file exists in the contract
     * @dev Useful for checking before attempting operations
     * @param fileHash SHA-256 hash of the file
     * @return bool True if file exists, false otherwise
     */
    function fileExists(bytes32 fileHash) external view returns (bool) {
        return files[fileHash].exists;
    }
}

