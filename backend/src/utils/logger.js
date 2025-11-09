// Custom Logger Utility
// Provides consistent logging across the application

const logger = {
  /**
   * Log informational messages
   */
  info: (message, ...args) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log error messages
   */
  error: (message, ...args) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log warning messages
   */
  warn: (message, ...args) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  },

  /**
   * Log successful operations
   */
  success: (message, ...args) => {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`, ...args);
  },
};

module.exports = logger;
