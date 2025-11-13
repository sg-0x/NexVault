import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Lock, Link as LinkIcon, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { uploadFile } from '../services/api';

const UploadFile = () => {
  const [files, setFiles] = useState([]);
  const [encrypt] = useState(true); // Backend always encrypts
  const fileInputRef = useRef();

  const onDrop = (ev) => {
    ev.preventDefault();
    const dt = ev.dataTransfer;
    const incoming = Array.from(dt.files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      progress: 0,
      metadata: null,
      status: 'queued',
      error: null,
    }));
    setFiles((s) => [...incoming, ...s]);
    incoming.forEach(handleRealUpload);
  };

  const onSelectFiles = (e) => {
    const incoming = Array.from(e.target.files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      progress: 0,
      metadata: null,
      status: 'queued',
      error: null,
    }));
    setFiles((s) => [...incoming, ...s]);
    incoming.forEach(handleRealUpload);
  };

  const handleRealUpload = async (item) => {
    const { id, file } = item;

    // Update status to uploading
    setFiles((list) =>
      list.map((f) => (f.id === id ? { ...f, status: 'uploading' } : f))
    );

    try {
      // Call real backend API
      const response = await uploadFile(file, (percentage) => {
        setFiles((list) =>
          list.map((f) => (f.id === id ? { ...f, progress: percentage } : f))
        );
        
        // When upload reaches 100%, show "Waiting for blockchain confirmation"
        if (percentage >= 100) {
          setFiles((list) =>
            list.map((f) => (f.id === id ? { ...f, status: 'blockchain-confirming' } : f))
          );
        }
      });

      // Upload successful - change status to "Uploaded"
      setFiles((list) =>
        list.map((f) =>
          f.id === id
            ? {
                ...f,
                progress: 100,
                status: 'uploaded',
                metadata: response.metadata,
              }
            : f
        )
      );
    } catch (error) {
      // Upload failed
      setFiles((list) =>
        list.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'error',
                error: error.message || 'Upload failed',
              }
            : f
        )
      );
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070708' }}>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Upload Files</h1>
            <p className="text-sm text-gray-400">
              Files are encrypted (AES-256-GCM), uploaded to AWS S3, and recorded on Ethereum blockchain
            </p>
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}
            >
              Select Files
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onSelectFiles} />
          </div>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-xl p-6 mb-6 border-2 border-dashed transition-colors hover:border-white/20"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-white" />
            </div>

            <div className="flex-1">
              <p className="text-white font-medium">Drop files here to upload</p>
              <p className="text-sm text-gray-400 mt-1">
                <Lock className="inline-block w-4 h-4 mr-1" />
                Files are encrypted with AES-256-GCM before upload • Max 50 MB per file
              </p>
            </div>
          </div>
        </div>

        {/* Upload queue */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Upload Queue</h2>
          <div className="space-y-4">
            {files.length === 0 && (
              <p className="text-gray-400 text-center py-8">No files in queue. Drag files here or click "Select Files"</p>
            )}
            {files.map((f) => (
              <div key={f.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{f.file.name}</p>
                      {f.status === 'uploaded' && <CheckCircle className="w-5 h-5 text-green-400" />}
                      {f.status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">
                      {(f.file.size / (1024 * 1024)).toFixed(2)} MB • Status: {
                        f.status === 'uploaded' ? 'Uploaded' :
                        f.status === 'blockchain-confirming' ? 'Waiting for blockchain confirmation' :
                        f.status === 'uploading' ? 'Uploading' :
                        f.status === 'queued' ? 'Queued' :
                        f.status === 'error' ? 'Error' :
                        f.status
                      }
                    </p>
                    {f.error && <p className="text-sm text-red-400 mt-1">Error: {f.error}</p>}
                  </div>
                </div>

                {/* Progress bar */}
                {f.status === 'uploading' && (
                  <div className="mb-3">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${f.progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #13ba82, #0fa070)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{f.progress}%</p>
                  </div>
                )}

                {/* Metadata display */}
                {f.metadata && (
                  <div className="mt-3 p-3 rounded-md" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">File Hash:</span>
                        <p className="text-white font-mono break-all">{f.metadata.hash.slice(0, 16)}...</p>
                      </div>
                      <div>
                        <span className="text-gray-400">S3 Key:</span>
                        <p className="text-white font-mono break-all">{f.metadata.s3Key}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Encrypted Size:</span>
                        <p className="text-white">{f.metadata.encryptedSizeMB} MB</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Upload Time:</span>
                        <p className="text-white">{new Date(f.metadata.uploadedAt).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    {f.metadata.txHash && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-400 text-xs">Blockchain Transaction:</span>
                            <p className="text-green-400 font-mono text-sm">{f.metadata.txHash.slice(0, 20)}...</p>
                          </div>
                          <a
                            href={`https://sepolia.etherscan.io/tx/${f.metadata.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded-md text-sm flex items-center gap-1"
                            style={{ background: 'rgba(19, 186, 130, 0.2)', color: '#13ba82' }}
                          >
                            View on Etherscan <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => copyToClipboard(f.metadata.hash)}
                        className="px-3 py-1 rounded-md text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                      >
                        Copy Hash
                      </button>
                      <button
                        onClick={() => copyToClipboard(f.metadata.s3Url)}
                        className="px-3 py-1 rounded-md text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                      >
                        Copy S3 URL
                      </button>
                      {f.metadata.txHash && (
                        <button
                          onClick={() => copyToClipboard(f.metadata.txHash)}
                          className="px-3 py-1 rounded-md text-sm"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                        >
                          Copy TxHash
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadFile;
