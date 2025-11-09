// Server Entry Point
const app = require('./app');
const { PORT } = require('./config/env');
const { initializeBlockchain } = require('./config/blockchain');
const logger = require('./utils/logger');

// Initialize blockchain connection
initializeBlockchain();

// Start server
const server = app.listen(PORT, () => {
  logger.success(`🚀 NexVault Backend Server started successfully`);
  logger.info(`📡 Server running on http://localhost:${PORT}`);
  logger.info(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✅ API Health Check: http://localhost:${PORT}/api/health`);
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
