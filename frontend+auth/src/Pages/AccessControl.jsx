import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Share2, Trash2, ExternalLink, CheckCircle, XCircle, FileText, X } from 'lucide-react';
import { grantAccess, revokeAccess, fetchUserFiles } from '../services/api';

const AccessControl = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [shareTarget, setShareTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  const openManage = (file) => {
    setEditing(file);
    setShareTarget('');
    setTxStatus(null);
  };

  const closeManage = () => {
    setEditing(null);
    setTxStatus(null);
  };

  const validateEthAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const addShare = async () => {
    if (!shareTarget) {
      alert('Enter a valid Ethereum wallet address');
      return;
    }

    if (!validateEthAddress(shareTarget)) {
      alert('Invalid Ethereum address format. Must be 0x followed by 40 hex characters.');
      return;
    }

    setSubmitting(true);
    setTxStatus({ type: 'info', message: 'Submitting blockchain transaction...' });

    try {
      const response = await grantAccess(editing.hash, shareTarget);
      console.log('Grant access response:', response);

      setTxStatus({
        type: 'success',
        message: 'Access granted successfully!',
        txHash: response.txHash,
      });

      // Update local state
      setFiles((list) =>
        list.map((f) =>
          f.id === editing.id
            ? { ...f, sharedWith: [...new Set([...(f.sharedWith || []), shareTarget])] }
            : f
        )
      );

      setShareTarget('');
    } catch (error) {
      console.error('Grant access failed:', error);
      setTxStatus({
        type: 'error',
        message: error.message || 'Failed to grant access',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const revokeShare = async (fileId, target) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    if (!confirm(`Revoke access for ${target}?`)) return;

    setSubmitting(true);
    setTxStatus({ type: 'info', message: 'Submitting revoke transaction...' });

    try {
      const response = await revokeAccess(file.hash, target);
      console.log('Revoke access response:', response);

      setTxStatus({
        type: 'success',
        message: 'Access revoked successfully!',
        txHash: response.txHash,
      });

      // Update local state
      setFiles((list) =>
        list.map((f) =>
          f.id === fileId ? { ...f, sharedWith: f.sharedWith.filter((t) => t !== target) } : f
        )
      );
    } catch (error) {
      console.error('Revoke access failed:', error);
      setTxStatus({
        type: 'error',
        message: error.message || 'Failed to revoke access',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const makePublic = (fileId) => {
    alert('Make public feature: Grant access to 0x0000000000000000000000000000000000000000 (not implemented in contract)');
    setFiles((list) => list.map((f) => (f.id === fileId ? { ...f, access: 'Public' } : f)));
  };

  const removeFile = (fileId) => {
    if (!confirm('Remove file from your account? This action cannot be undone.')) return;
    setFiles((list) => list.filter((f) => f.id !== fileId));
  };

  // Fetch files on component mount
  useEffect(() => {
    async function loadFiles() {
      try {
        const userFiles = await fetchUserFiles();
        // Transform Firestore data to match AccessControl format
        const transformedFiles = userFiles.map((file) => ({
          id: file.id,
          name: file.fileName || 'Untitled',
          hash: file.hash,
          s3Key: file.s3Key,
          access: 'Private', // Default to private (can be enhanced with blockchain query)
          sharedWith: [], // Can be populated from blockchain
          expires: null,
          txHash: file.txHash,
        }));
        setFiles(transformedFiles);
        console.log(`Loaded ${transformedFiles.length} files for access control`);
      } catch (error) {
        console.error('Failed to load files:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, []);

  return (
    <div className="min-h-screen p-8" style={{ background: '#070708' }}>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Access Control</h1>
              <p className="text-sm text-gray-400">Manage who can access your files and revoke shares</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Your Files</h2>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading your files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No files uploaded yet</p>
              <button
                onClick={() => window.location.assign('/upload-file')}
                className="px-4 py-2 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}
              >
                Upload Your First File
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div>
                  <p className="text-white font-medium">{f.name}</p>
                  <p className="text-sm text-gray-400">CID: <span className="font-mono">{f.cid}</span></p>
                  <p className="text-sm text-gray-400">Access: <span className="text-white">{f.access}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openManage(f)} className="px-3 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
                    <Share2 className="inline-block mr-2" /> Manage
                  </button>
                  <button onClick={() => makePublic(f.id)} className="px-3 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: '#13ba82' }}>
                    Make Public
                  </button>
                  <button onClick={() => removeFile(f.id)} className="px-3 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: '#ef4444' }}>
                    <Trash2 className="inline-block mr-1" /> Remove
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Manage modal (simple inline panel) */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={closeManage} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 max-w-lg w-full rounded-xl p-6"
              style={{ background: 'rgba(26, 26, 26, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Manage Access</h3>
                  <p className="text-sm text-gray-400">{editing.name}</p>
                </div>
                <button
                  onClick={closeManage}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* File hash display */}
              <div className="mb-4 p-3 rounded-md" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <p className="text-xs text-gray-400">File Hash:</p>
                <p className="text-xs text-white font-mono break-all">{editing.hash}</p>
              </div>

              {/* Transaction status */}
              {txStatus && (
                <div
                  className={`mb-4 p-3 rounded-md flex items-start gap-2 ${
                    txStatus.type === 'success'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : txStatus.type === 'error'
                      ? 'bg-red-500/10 border border-red-500/20'
                      : 'bg-blue-500/10 border border-blue-500/20'
                  }`}
                >
                  {txStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
                  {txStatus.type === 'error' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        txStatus.type === 'success'
                          ? 'text-green-400'
                          : txStatus.type === 'error'
                          ? 'text-red-400'
                          : 'text-blue-400'
                      }`}
                    >
                      {txStatus.message}
                    </p>
                    {txStatus.txHash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txStatus.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1"
                      >
                        View on Etherscan <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-2">Shared with ({editing.sharedWith?.length || 0})</p>
                {editing.sharedWith?.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No one has access yet</p>
                ) : (
                  <div className="space-y-2">
                    {(editing.sharedWith || []).map((s) => (
                      <div
                        key={s}
                        className="flex items-center justify-between p-2 rounded-md"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                      >
                        <div className="text-sm text-gray-200 font-mono">{s.slice(0, 10)}...{s.slice(-8)}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-400 px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            read
                          </div>
                          <button
                            onClick={() => revokeShare(editing.id, s)}
                            disabled={submitting}
                            className="px-2 py-1 rounded-md text-sm"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                          >
                            {submitting ? 'Revoking...' : 'Revoke'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-2">Grant access to wallet address</p>
                <div className="flex gap-2">
                  <input
                    value={shareTarget}
                    onChange={(e) => setShareTarget(e.target.value)}
                    placeholder="0x742d35Cc6634C0532925a3b844..."
                    className="flex-1 px-3 py-2 rounded-md text-sm"
                    style={{ background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                    disabled={submitting}
                  />
                  <button
                    onClick={addShare}
                    disabled={submitting || !shareTarget}
                    className="px-4 py-2 rounded-md font-medium"
                    style={{
                      background: submitting || !shareTarget ? 'rgba(19, 186, 130, 0.3)' : 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)',
                      color: 'white',
                      cursor: submitting || !shareTarget ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting ? 'Granting...' : 'Grant'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter a valid Ethereum address (0x followed by 40 hex characters)
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  onClick={closeManage}
                  className="px-4 py-2 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AccessControl;
