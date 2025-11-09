// Validation Middleware
// Validate incoming request data

/**
 * Validate file upload request
 */
const validateFileUpload = (req, res, next) => {
  try {
    // Check if file exists in request
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Additional validation can be added here
    // - File size limits
    // - File type restrictions
    // - Metadata validation

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: error.message,
    });
  }
};

/**
 * Validate access control requests
 */
const validateAccessRequest = (req, res, next) => {
  try {
    const { fileId, address } = req.body;

    if (!fileId || !address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fileId and address',
      });
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address format',
      });
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: error.message,
    });
  }
};

module.exports = {
  validateFileUpload,
  validateAccessRequest,
};
