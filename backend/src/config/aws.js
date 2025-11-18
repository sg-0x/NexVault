// AWS S3 Client Configuration
const { S3Client } = require('@aws-sdk/client-s3');
const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = require('./env');

// Initialize S3 client with credentials
// Note: AWS_REGION must match your S3 bucket's actual region (eu-north-1)
if (!AWS_REGION) {
  throw new Error('AWS_REGION environment variable is required');
}

const s3ClientConfig = {
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
};

// For eu-north-1 and some other regions, explicitly set the endpoint
// This fixes "bucket must be addressed using the specified endpoint" errors
if (AWS_REGION === 'eu-north-1') {
  s3ClientConfig.endpoint = `https://s3.${AWS_REGION}.amazonaws.com`;
}

const s3Client = new S3Client(s3ClientConfig);

module.exports = s3Client;
