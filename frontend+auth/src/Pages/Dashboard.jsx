import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PieChart, Clock, Upload, Shield, Wallet, ExternalLink, FileText, Lock, Globe, File, Image, Video, FileSpreadsheet, Archive, RefreshCw, Share2, Loader2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { fetchUserFiles, getDownloadUrl } from '../services/api';
import { 
  isCryptoSupported, 
  decryptFileClientSide, 
  createDownloadableFile, 
  downloadEncryptedFile,
  estimateMemoryRequirements 
} from '../utils/cryptoUtils';

// Helper function to format storage size in MB
const formatStorageMB = (mb) => {
  if (mb < 1) {
    return `${(mb * 1024).toFixed(0)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
};

// Helper function to get file icon based on file type
const getFileIcon = (fileName, mimeType) => {
  const extension = fileName?.split('.').pop()?.toLowerCase() || '';
  const type = mimeType?.toLowerCase() || '';
  
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
    return { Icon: Image, color: '#13ba82' };
  }
  if (type.includes('video') || ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension)) {
    return { Icon: Video, color: 'white' };
  }
  if (type.includes('spreadsheet') || type.includes('excel') || ['xlsx', 'xls', 'csv'].includes(extension)) {
    return { Icon: FileSpreadsheet, color: 'white' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return { Icon: Archive, color: 'white' };
  }
  return { Icon: File, color: 'white' };
};

// Helper function to format file size
const formatFileSize = (sizeMB) => {
  if (sizeMB < 1) {
    return `${(sizeMB * 1024).toFixed(1)} KB`;
  }
  return `${sizeMB.toFixed(1)} MB`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [ownedFiles, setOwnedFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState({ name: 'Free', quotaMB: 5120, usedMB: 0 }); // 5 GB = 5120 MB
  const [nodeHealth, setNodeHealth] = useState({ replicas: 3, online: 3 });
  const [downloadingFile, setDownloadingFile] = useState(null); // Track which file is being downloaded
  const [downloadProgress, setDownloadProgress] = useState({}); // Track download progress per file
  const [decryptionStatus, setDecryptionStatus] = useState({}); // Track decryption status per file

  // Function to load files
  const loadFiles = async (userUid) => {
    try {
      setLoading(true);
      setError(null);
      const userFiles = await fetchUserFiles();
      setFiles(userFiles);
      
      // Separate owned and shared files
      const owned = userFiles.filter(f => f.isOwner !== false);
      const shared = userFiles.filter(f => f.isShared === true);
      setOwnedFiles(owned);
      setSharedFiles(shared);
      
      // Calculate total used storage (only count owned files)
      const totalUsedMB = owned.reduce((sum, file) => {
        const fileSize = file.originalSizeMB || file.encryptedSizeMB || 0;
        return sum + fileSize;
      }, 0);
      
      setPlan((prev) => ({
        ...prev,
        usedMB: totalUsedMB,
      }));
      
      console.log(`✅ Loaded ${owned.length} owned files and ${shared.length} shared files from Firestore`);
    } catch (error) {
      console.error('❌ Failed to load files:', error);
      setError(error.message || 'Failed to load files. Make sure you are logged in and backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser({ displayName: u.displayName || 'User', email: u.email, photoURL: u.photoURL });
        // Fetch real files from Firestore
        await loadFiles(u.uid);
      } else {
        setUser(null);
        setFiles([]);
        setLoading(false);
        setError(null);
      }
    });

    // stub node health (can be replaced with real blockchain query later)
    setNodeHealth({ replicas: 3, online: 3 });

    return () => unsub();
  }, []);

  // Handle file click - download encrypted file and decrypt client-side
  const handleFileClick = async (file) => {
    // Prevent duplicate clicks
    if (downloadingFile === file.id) {
      console.log('[Dashboard] Download already in progress for this file');
      return;
    }

    console.log(`[Dashboard] User clicked file: ${file.fileName} (${file.id})`);
    setDownloadingFile(file.id);
    setDecryptionStatus(prev => ({ ...prev, [file.id]: 'initializing' }));

    try {
      // Step 1: Check browser compatibility
      if (!isCryptoSupported()) {
        throw new Error(
          'Your browser does not support file decryption. ' +
          'Please use a modern browser (Chrome 37+, Firefox 34+, Safari 11+).'
        );
      }
      console.log('[Dashboard] ✓ Browser supports Web Crypto API');

      // Step 2: Validate file has S3 key
      if (!file.s3Key) {
        throw new Error('File S3 key is missing. Cannot download file.');
      }

      // Step 3: Validate encryption keys exist
      if (!file.aesKey || !file.iv || !file.authTag) {
        throw new Error(
          'Encryption keys are missing from file metadata. ' +
          'This file cannot be decrypted. Please re-upload the file.'
        );
      }
      console.log('[Dashboard] ✓ Encryption keys validated');

      // Step 4: Check file size and warn user
      const fileSizeMB = file.encryptedSizeMB || file.originalSizeMB || 0;
      const memoryEstimate = estimateMemoryRequirements(fileSizeMB);
      
      console.log(`[Dashboard] File size: ${fileSizeMB.toFixed(2)} MB`);
      console.log(`[Dashboard] Estimated memory: ${memoryEstimate.estimatedMemoryMB} MB`);
      console.log(`[Dashboard] ${memoryEstimate.message}`);

      if (memoryEstimate.warning) {
        const proceed = confirm(
          `⚠️ Large File Warning\n\n` +
          `File size: ${fileSizeMB.toFixed(1)} MB\n` +
          `Estimated memory: ~${memoryEstimate.estimatedMemoryMB} MB\n\n` +
          `${memoryEstimate.message}\n\n` +
          `This may take 10-30 seconds. Continue?`
        );
        
        if (!proceed) {
          console.log('[Dashboard] User cancelled large file download');
          setDownloadingFile(null);
          setDecryptionStatus(prev => ({ ...prev, [file.id]: null }));
          return;
        }
      }

      // Step 5: Get pre-signed URL from backend
      console.log('[Dashboard] [1/4] Requesting pre-signed URL from backend...');
      setDecryptionStatus(prev => ({ ...prev, [file.id]: 'fetching-url' }));

      const response = await getDownloadUrl(file.s3Key);
      
      if (!response.success || !response.data?.downloadUrl) {
        throw new Error('Failed to generate download URL from backend');
      }

      const presignedUrl = response.data.downloadUrl;
      console.log('[Dashboard] ✓ Pre-signed URL generated');

      // Step 6: Download encrypted file from S3
      console.log('[Dashboard] [2/4] Downloading encrypted file from S3...');
      setDecryptionStatus(prev => ({ ...prev, [file.id]: 'downloading' }));

      const encryptedArrayBuffer = await downloadEncryptedFile(
        presignedUrl,
        (progress) => {
          setDownloadProgress(prev => ({ ...prev, [file.id]: progress }));
          console.log(`[Dashboard] Download progress: ${progress}%`);
        }
      );

      console.log(`[Dashboard] ✓ Downloaded ${(encryptedArrayBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
      setDownloadProgress(prev => ({ ...prev, [file.id]: 100 }));

      // Step 7: Decrypt file in browser
      console.log('[Dashboard] [3/4] Decrypting file with AES-256-GCM...');
      setDecryptionStatus(prev => ({ ...prev, [file.id]: 'decrypting' }));

      const decryptedBuffer = await decryptFileClientSide(
        encryptedArrayBuffer,
        file.aesKey,
        file.iv,
        file.authTag
      );

      console.log(`[Dashboard] ✓ Decrypted ${(decryptedBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

      // Step 8: Create blob URL
      console.log('[Dashboard] [4/4] Creating downloadable file...');
      setDecryptionStatus(prev => ({ ...prev, [file.id]: 'creating-blob' }));

      const blobUrl = createDownloadableFile(
        decryptedBuffer,
        file.fileName,
        file.mimeType || 'application/octet-stream'
      );

      console.log('[Dashboard] ✓ Blob URL created');

      // Step 9: Open file in new tab OR trigger download
      console.log('[Dashboard] Opening file in new tab...');
      setDecryptionStatus(prev => ({ ...prev, [file.id]: 'opening' }));

      const newWindow = window.open(blobUrl, '_blank');

      // Fallback: If popup blocked, trigger download instead
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        console.log('[Dashboard] Popup blocked, triggering download instead...');
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('[Dashboard] ✓ Download triggered');
      } else {
        console.log('[Dashboard] ✓ File opened in new tab');
      }

      // Step 10: Cleanup blob URL after 2 seconds
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        console.log('[Dashboard] ✓ Blob URL cleaned up');
      }, 2000);

      console.log('[Dashboard] ✅ File decryption and opening completed successfully!');

    } catch (error) {
      console.error('[Dashboard] ❌ Failed to open file:', error);
      
      // User-friendly error messages
      let errorMessage = 'Failed to open file';
      
      if (error.message?.includes('browser does not support')) {
        errorMessage = '🔒 ' + error.message;
      } else if (error.message?.includes('missing')) {
        errorMessage = '🔑 ' + error.message;
      } else if (error.message?.includes('Decryption failed')) {
        errorMessage = '⚠️ ' + error.message;
      } else if (error.message?.includes('Download failed')) {
        errorMessage = '📥 ' + error.message;
      } else if (error.message?.includes('memory')) {
        errorMessage = '💾 ' + error.message;
      } else {
        errorMessage = `❌ ${error.message || 'Unknown error occurred'}`;
      }

      alert(errorMessage);
      
    } finally {
      // Cleanup state
      setDownloadingFile(null);
      setDownloadProgress(prev => {
        const newState = { ...prev };
        delete newState[file.id];
        return newState;
      });
      setDecryptionStatus(prev => {
        const newState = { ...prev };
        delete newState[file.id];
        return newState;
      });
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070708' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-400">Overview of your NexVault account</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/access-control')}
              className="px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}
            >
              Manage Access
            </button>
            <button
              onClick={() => user && loadFiles(user.uid)}
              className="px-3 py-2 rounded-lg flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
              title="Refresh files list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3 mb-3">
                <PieChart className="w-6 h-6 text-white" />
                <div>
                  <p className="text-sm text-gray-300">Storage</p>
                <p className="text-lg font-semibold text-white">{formatStorageMB(plan.usedMB)} / {formatStorageMB(plan.quotaMB)}</p>
              </div>
            </div>
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(plan.usedMB / Math.max(1, plan.quotaMB)) * 100}%`, background: 'linear-gradient(90deg, #13ba82, #0fa070)' }} />
            </div>
          </div>

          <div 
            className="rounded-xl p-4 cursor-pointer hover:opacity-80 transition-opacity" 
            style={{ background: 'rgba(255,255,255,0.02)' }}
            onClick={() => navigate('/access-control')}
          >
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-6 h-6 text-white" />
              <div>
                <p className="text-sm text-gray-300">Total Files</p>
                <p className="text-lg font-semibold text-white">{files.length}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {files.length === 0 ? 'No files uploaded yet' : `${files.length} file${files.length !== 1 ? 's' : ''} stored`}
            </p>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-white" />
              <div>
                <p className="text-sm text-gray-300">Encryption</p>
                <p className="text-lg font-semibold text-white">Client-side</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">Key backup: Backed up</p>
          </div>
        </div>

        {/* My Files Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">My Files</h2>
            <button
              onClick={() => navigate('/upload-file')}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}
            >
              + Upload New File
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading files...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-2">⚠️ {error}</p>
              <button
                onClick={() => user && loadFiles(user.uid)}
                className="px-4 py-2 rounded-lg mt-3"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Retry
              </button>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No files uploaded yet</p>
              <button
                onClick={() => navigate('/upload-file')}
                className="px-6 py-3 rounded-lg font-medium"
                style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}
              >
                Upload Your First File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => {
                const { Icon, color } = getFileIcon(file.fileName, file.mimeType);
                const isPrivate = true; // Default to private, can be enhanced with access control data
                const displayName = file.fileName?.length > 25 
                  ? `${file.fileName.substring(0, 25)}...` 
                  : file.fileName;

                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform relative"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    onClick={() => handleFileClick(file)}
                  >
                    {/* Loading overlay with progress and status */}
                    {downloadingFile === file.id && (
                      <div className="absolute inset-0 bg-black/80 rounded-xl flex flex-col items-center justify-center z-10 p-4">
                        <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
                        <p className="text-white text-sm font-medium mb-2">
                          {decryptionStatus[file.id] === 'initializing' && 'Initializing...'}
                          {decryptionStatus[file.id] === 'fetching-url' && 'Getting download link...'}
                          {decryptionStatus[file.id] === 'downloading' && `Downloading: ${downloadProgress[file.id] || 0}%`}
                          {decryptionStatus[file.id] === 'decrypting' && '🔓 Decrypting file...'}
                          {decryptionStatus[file.id] === 'creating-blob' && 'Preparing file...'}
                          {decryptionStatus[file.id] === 'opening' && 'Opening file...'}
                        </p>
                        {decryptionStatus[file.id] === 'downloading' && downloadProgress[file.id] > 0 && (
                          <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                            <div 
                              className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-300"
                              style={{ width: `${downloadProgress[file.id]}%` }}
                            />
                          </div>
                        )}
                        <p className="text-gray-400 text-xs mt-2">Please wait...</p>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{displayName}</p>
                          <p className="text-sm text-gray-400 mt-1">{formatFileSize(file.encryptedSizeMB || 0)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        {isPrivate ? (
                          <>
                            <Lock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-400">Private</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-400">Public</span>
                          </>
                        )}
                      </div>
                      {file.txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${file.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          View Tx
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shared with me section */}
        {sharedFiles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Shared with me</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedFiles.map((file) => {
                const { Icon, color } = getFileIcon(file.fileName, file.mimeType);
                const displayName = file.fileName?.length > 25 
                  ? `${file.fileName.substring(0, 25)}...` 
                  : file.fileName;

                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform relative"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(19,186,130,0.3)' }}
                    onClick={() => handleFileClick(file)}
                  >
                    {/* Loading overlay with progress and status */}
                    {downloadingFile === file.id && (
                      <div className="absolute inset-0 bg-black/80 rounded-xl flex flex-col items-center justify-center z-10 p-4">
                        <Loader2 className="w-10 h-10 text-green-400 animate-spin mb-3" />
                        <p className="text-white text-sm font-medium mb-2">
                          {decryptionStatus[file.id] === 'initializing' && 'Initializing...'}
                          {decryptionStatus[file.id] === 'fetching-url' && 'Getting download link...'}
                          {decryptionStatus[file.id] === 'downloading' && `Downloading: ${downloadProgress[file.id] || 0}%`}
                          {decryptionStatus[file.id] === 'decrypting' && '🔓 Decrypting file...'}
                          {decryptionStatus[file.id] === 'creating-blob' && 'Preparing file...'}
                          {decryptionStatus[file.id] === 'opening' && 'Opening file...'}
                        </p>
                        {decryptionStatus[file.id] === 'downloading' && downloadProgress[file.id] > 0 && (
                          <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden mt-2">
                            <div 
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
                              style={{ width: `${downloadProgress[file.id]}%` }}
                            />
                          </div>
                        )}
                        <p className="text-gray-400 text-xs mt-2">Please wait...</p>
                      </div>
                    )}
                    
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(19,186,130,0.1)' }}>
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{displayName}</p>
                          <p className="text-sm text-gray-400 mt-1">{formatFileSize(file.encryptedSizeMB || 0)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-400">Shared</span>
                      </div>
                      {file.txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${file.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          View Tx
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Middle: Node health + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Node health & sync</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Replicas: {nodeHealth.replicas}</p>
                <p className="text-sm text-gray-400">Online nodes: {nodeHealth.online}</p>
                {nodeHealth.online < nodeHealth.replicas && (
                  <p className="text-sm text-yellow-400 mt-2">Some replicas are offline — re-pin recommended.</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">Last sync</p>
                <p className="text-white">2m ago</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Recent Files</h2>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Loading files...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-2">⚠️ {error}</p>
                <p className="text-sm text-gray-500 mb-3">Make sure:</p>
                <ul className="text-xs text-gray-500 text-left max-w-xs mx-auto mb-3">
                  <li>• Backend server is running</li>
                  <li>• You are logged in with Firebase</li>
                  <li>• Firestore is configured in backend</li>
                </ul>
                <button
                  onClick={() => user && loadFiles(user.uid)}
                  className="px-4 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                >
                  Retry
                </button>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No files uploaded yet</p>
                <button
                  onClick={() => navigate('/upload-file')}
                  className="mt-3 px-4 py-2 rounded-lg"
                  style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}
                >
                  Upload Your First File
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {files.slice(0, 5).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div className="flex-1">
                      <p className="text-white font-medium">{file.fileName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {file.encryptedSizeMB?.toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                      {file.txHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${file.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1"
                        >
                          View on Etherscan <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom quick actions */}
        <div className="mt-6 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/upload-file')} className="px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
              <Clock className="inline-block mr-2" /> Upload File
            </button>
            <button onClick={() => navigate('/access-control')} className="px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
              <Shield className="inline-block mr-2" /> Manage Access
            </button>
            <button onClick={() => navigate('/profile')} className="px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
              <Wallet className="inline-block mr-2" /> Wallets
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
