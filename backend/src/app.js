// Express Application Configuration
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const routes = require('./routes');
const filesRoutes = require('./routes/files.routes');
const userRoutes = require('./routes/user.routes');

// Initialize Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:5173', // Vite default dev server
      'http://localhost:3000', // React dev server alternative
      'http://localhost:5174', // Vite alternative port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL, // Production frontend URL from env
    ].filter(Boolean); // Remove undefined values

    // Allow all origins for now (production should restrict this)
    console.log(`[CORS] Request from origin: ${origin}`);
    callback(null, true);
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
};

// Middleware
app.use(cors(corsOptions)); // Enable CORS with configuration
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// API Routes
app.use('/api', routes);
app.use('/api/files', filesRoutes);
app.use('/api/user', userRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to NexVault API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      upload: '/api/upload',
      download: '/api/download/:fileId',
      access: '/api/access',
    },
  });
});

// Handle 404 errors
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
