// Server Entry Point
const app = require('./app');
const { PORT } = require('./config/env');
const { initializeBlockchain } = require('./config/blockchain');
const logger = require('./utils/logger');

// Initialize blockchain connection
initializeBlockchain();

// Start server
// Listen on 0.0.0.0 to allow Railway/external connections
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.success(`🚀 NexVault Backend Server started successfully`);
  logger.info(`📡 Server running on http://0.0.0.0:${PORT}`);
  logger.info(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✅ API Health Check: http://0.0.0.0:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = server;
