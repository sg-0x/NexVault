# 🚀 Deployment Guide - NexVault

## Recommended Platform: Railway

Railway is the best choice for this full-stack application because:
- ✅ Deploy both frontend and backend in one project
- ✅ Easy environment variable management
- ✅ Automatic HTTPS/SSL certificates
- ✅ Free tier available ($5 credit/month)
- ✅ Simple Git-based deployments

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Needed

#### Backend Environment Variables:
```bash
# Server
PORT=5000
NODE_ENV=production

# AWS S3
AWS_REGION=your-aws-region
AWS_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Blockchain (Ethereum/Sepolia)
INFURA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CONTRACT_ADDRESS=your-deployed-contract-address
PRIVATE_KEY=your-ethereum-private-key

# Firebase (optional - for service account)
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

#### Frontend Environment Variables:
```bash
# Backend API URL (will be set automatically by Railway)
VITE_BACKEND_URL=https://your-backend.railway.app

# Firebase Config
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 2. Files to Prepare

- ✅ `serviceAccountKey.json` - Firebase service account key (needs to be uploaded as a secret file)
- ✅ All environment variables documented above

---

## 🚂 Railway Deployment Steps

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended) or email
3. Verify your email if needed

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"** (or upload manually)
3. Connect your GitHub account and select the `nexvault` repository

### Step 3: Deploy Backend

1. **Add Backend Service:**
   - Click **"+ New"** → **"GitHub Repo"**
   - Select your repository
   - Railway will auto-detect it's a Node.js app

2. **Configure Backend:**
   - **Root Directory:** Set to `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Port:** Railway will auto-detect from `PORT` env var

3. **Add Environment Variables:**
   - Go to **Variables** tab
   - Add all backend environment variables listed above
   - For `FIREBASE_SERVICE_ACCOUNT_PATH`, you'll need to upload the JSON file (see Step 4)

4. **Upload Firebase Service Account:**
   - Go to **Variables** tab
   - Click **"New Variable"**
   - Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Value: Paste the entire JSON content of `serviceAccountKey.json`
   - Then in your backend code, you can read from this env var and write to a file, OR:
   - Better: Modify `backend/src/config/firebase.js` to read from `process.env.FIREBASE_SERVICE_ACCOUNT_KEY` and parse it

### Step 4: Deploy Frontend

1. **Add Frontend Service:**
   - Click **"+ New"** → **"GitHub Repo"** (same repo)
   - Select your repository again

2. **Configure Frontend:**
   - **Root Directory:** Set to `frontend+auth`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s dist -l 3000` (or use Railway's static file serving)
   - **Output Directory:** `dist`

3. **Add Environment Variables:**
   - Go to **Variables** tab
   - Add all frontend environment variables
   - **Important:** Set `VITE_BACKEND_URL` to your backend Railway URL (e.g., `https://nexvault-backend.railway.app`)

### Step 5: Update Firebase Service Account Handling

Since Railway doesn't support file uploads directly, modify the backend to read from an environment variable:

**Option A: Use Environment Variable (Recommended)**
```javascript
// In backend/src/config/firebase.js
// Replace file reading with:
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (serviceAccountJson) {
  const serviceAccount = JSON.parse(serviceAccountJson);
  // ... rest of initialization
}
```

**Option B: Use Railway's Volume/File System**
- Railway supports persistent volumes, but env vars are simpler

### Step 6: Configure Domains

1. **Backend:**
   - Go to backend service → **Settings** → **Generate Domain**
   - Copy the domain (e.g., `nexvault-backend.railway.app`)

2. **Frontend:**
   - Go to frontend service → **Settings** → **Generate Domain**
   - Copy the domain (e.g., `nexvault-frontend.railway.app`)
   - Update `VITE_BACKEND_URL` in frontend env vars to point to backend domain

### Step 7: Enable CORS (if needed)

Your backend should already have CORS configured, but verify:
- Backend should allow requests from your frontend domain
- Check `backend/src/app.js` for CORS settings

---

## 🔧 Alternative: Vercel (Frontend) + Railway (Backend)

If you prefer Vercel for the frontend:

### Vercel Frontend Setup:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Root Directory:** `frontend+auth`
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. Add all `VITE_*` environment variables
7. Deploy!

### Railway Backend Setup:
- Follow Step 3 above for backend deployment

---

## 🐛 Troubleshooting

### Backend Issues:
- **Port binding:** Railway sets `PORT` automatically, ensure your code uses `process.env.PORT`
- **Firebase:** Make sure `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
- **AWS S3:** Verify credentials and bucket permissions
- **Blockchain:** Ensure Infura URL and contract address are correct

### Frontend Issues:
- **API calls failing:** Check `VITE_BACKEND_URL` is set correctly
- **Firebase auth:** Verify all Firebase env vars are set
- **Build errors:** Check Railway build logs for missing dependencies

### Common Errors:
- **"Cannot find module":** Ensure `package.json` has all dependencies
- **"Port already in use":** Railway handles this automatically
- **"CORS error":** Update backend CORS to allow frontend domain

---

## 📝 Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is running and accessible
- [ ] Frontend can connect to backend API
- [ ] Firebase authentication works
- [ ] File upload works (test with a small file)
- [ ] Blockchain transactions work (test on Sepolia)
- [ ] Environment variables are all set correctly
- [ ] Custom domains configured (optional)

---

## 💰 Cost Estimation

### Railway Free Tier:
- $5 credit/month
- ~500 hours of runtime
- Good for testing/small projects

### Railway Paid:
- $5/month for Hobby plan
- $20/month for Pro plan (better for production)

### Vercel:
- Free tier available
- Great for frontend hosting

---

## 🔐 Security Notes

1. **Never commit:**
   - `.env` files
   - `serviceAccountKey.json`
   - Private keys
   - AWS credentials

2. **Use Railway Secrets:**
   - All sensitive data should be in Railway's environment variables
   - Mark sensitive variables as "Secret" in Railway

3. **Firebase Rules:**
   - Update Firestore security rules for production
   - Restrict access appropriately

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Hosting](https://firebase.google.com/docs/hosting) (alternative for frontend)

---

## 🎉 You're Done!

Once deployed, your app will be live at:
- Frontend: `https://your-frontend.railway.app`
- Backend: `https://your-backend.railway.app`

Update your Firebase authorized domains to include your Railway domains!

