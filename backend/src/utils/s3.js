// AWS S3 Utility Functions
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/aws');
const { AWS_BUCKET, AWS_REGION } = require('../config/env');
const logger = require('./logger');

/**
 * Upload a file to S3
 * @param {string} key - S3 object key (filename)
 * @param {Buffer} buffer - File data to upload
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} S3 file URL
 */
async function uploadToS3(key, buffer, contentType = 'application/octet-stream') {
  try {
    // Prepare upload parameters
    const uploadParams = {
      Bucket: AWS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    };

    // Create and send the upload command
    const command = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(command);

    // Construct the S3 URL for the uploaded file
    const fileUrl = `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    
    logger.info(`File uploaded to S3: ${key}`);
    logger.debug(`S3 URL: ${fileUrl}`);

    return fileUrl;
  } catch (error) {
    logger.error(`S3 upload failed: ${error.message}`);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Get a pre-signed URL for secure file download from S3
 * Pre-signed URLs provide temporary access to private S3 objects
 * 
 * @param {string} key - S3 object key (filename)
 * @param {number} expiresIn - URL expiration time in seconds (default: 5 minutes)
 * @returns {Promise<string>} Pre-signed download URL
 */
async function getFileFromS3(key, expiresIn = 300) {
  try {
    // Create a GetObject command for the file
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
    });

    // Generate a pre-signed URL that expires after the specified time
    // This allows temporary access to private S3 objects without exposing credentials
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    logger.info(`Generated pre-signed URL for: ${key} (expires in ${expiresIn}s)`);
    
    return signedUrl;
  } catch (error) {
    logger.error(`Failed to generate pre-signed URL: ${error.message}`);
    throw new Error(`Failed to generate download URL for ${key}: ${error.message}`);
  }
}

/**
 * Download file data directly from S3 as a buffer
 * Used when the backend needs to decrypt the file before sending to client
 * 
 * @param {string} key - S3 object key (filename)
 * @returns {Promise<Buffer>} File data as buffer
 */
async function downloadFromS3(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
    });

    const result = await s3Client.send(command);
    
    // Convert the readable stream to a buffer
    const chunks = [];
    for await (const chunk of result.Body) {
      chunks.push(chunk);
    }
    const data = Buffer.concat(chunks);

    logger.info(`File downloaded from S3: ${key} (${data.length} bytes)`);
    return data;
  } catch (error) {
    logger.error(`S3 download failed: ${error.message}`);
    throw new Error(`Failed to download file from S3: ${error.message}`);
  }
}

/**
 * Delete a file from S3
 * @param {string} key - S3 object key (filename)
 * @returns {Promise<Object>} Deletion result
 */
async function deleteFromS3(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: AWS_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    logger.info(`File deleted from S3: ${key}`);

    return {
      success: true,
      key,
    };
  } catch (error) {
    logger.error(`S3 deletion failed: ${error.message}`);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
}

module.exports = {
  uploadToS3,
  getFileFromS3,
  downloadFromS3,
  deleteFromS3,
};
