# NexVault Backend

A blockchain-assisted cloud storage backend built with Node.js, AWS S3, and Ethereum.

## 🚀 Features

- **Secure File Storage**: AES-256-GCM encryption for all files before storage
- **Blockchain Integration**: Ethereum smart contracts for metadata and access control
- **AWS S3**: Scalable cloud storage infrastructure
- **RESTful API**: Clean and modular Express.js architecture

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- AWS Account with S3 access
- Ethereum wallet and Infura/Alchemy API key

## 🛠️ Installation

1. Clone the repository and navigate to the backend folder:
   ```bash
   cd nexvault/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your actual credentials:
   - AWS credentials and S3 bucket name
   - Infura URL for Ethereum network
   - Smart contract address (after deployment)
   - Private key for blockchain transactions

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in `.env`)

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js              # Server entry point
│   ├── config/                # Configuration files
│   │   ├── env.js            # Environment variables
│   │   ├── aws.js            # AWS S3 client setup
│   │   └── blockchain.js     # Ethereum provider setup
│   ├── routes/                # API routes
│   │   ├── upload.routes.js
│   │   ├── download.routes.js
│   │   ├── access.routes.js
│   │   └── index.js
│   ├── controllers/           # Route controllers
│   │   ├── upload.controller.js
│   │   ├── download.controller.js
│   │   └── access.controller.js
│   ├── utils/                 # Utility functions
│   │   ├── encryption.js
│   │   ├── s3.js
│   │   ├── blockchain.js
│   │   └── logger.js
│   └── middleware/            # Express middleware
│       ├── auth.js
│       ├── errorHandler.js
│       └── validate.js
├── .env.example
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Health Check
- `GET /api/health` - Check if the server is running

### Upload (Coming Soon)
- `POST /api/upload` - Upload and encrypt a file

### Download (Coming Soon)
- `GET /api/download/:fileId` - Download and decrypt a file

### Access Control (Coming Soon)
- `POST /api/access/grant` - Grant access to a file
- `POST /api/access/revoke` - Revoke access to a file
- `GET /api/access/verify` - Verify access permissions

## 🔐 Security

- All files are encrypted using AES-256-GCM before storage
- Encryption keys are never stored on the server
- Blockchain ensures immutable access control
- CORS and security headers enabled

## 📝 License

MIT
