import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Share2, Trash2 } from 'lucide-react';

// stubbed file list
const initialFiles = [
  { id: 'f1', name: 'report.pdf', cid: 'bafy1234report', access: 'Private', sharedWith: ['0xAbC...'], expires: null },
  { id: 'f2', name: 'photos.zip', cid: 'bafy5678photo', access: 'Shared', sharedWith: ['0xFfF...','ayu@example.com'], expires: '2025-12-01' },
];

const AccessControl = () => {
  const [files, setFiles] = useState(initialFiles);
  const [editing, setEditing] = useState(null);
  const [shareTarget, setShareTarget] = useState('');
  const [permission, setPermission] = useState('read');

  const openManage = (file) => {
    setEditing(file);
    setShareTarget('');
    setPermission('read');
  };

  const closeManage = () => setEditing(null);

  const addShare = () => {
    if (!shareTarget) return alert('Enter wallet address or email');
    setFiles((list) => list.map(f => f.id === editing.id ? { ...f, sharedWith: [...new Set([...(f.sharedWith||[]), shareTarget])] } : f));
    setShareTarget('');
  };

  const revokeShare = (fileId, target) => {
    setFiles((list) => list.map(f => f.id === fileId ? { ...f, sharedWith: f.sharedWith.filter(t => t !== target) } : f));
  };

  const makePublic = (fileId) => {
    setFiles((list) => list.map(f => f.id === fileId ? { ...f, access: 'Public' } : f));
  };

  const removeFile = (fileId) => {
    if (!confirm('Remove file from your account? This will unpin your copy.')) return;
    setFiles((list) => list.filter(f => f.id !== fileId));
  };

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

          <div>
            <button onClick={() => alert('Open share manager')} className="px-4 py-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}>
              New Share
            </button>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Files</h2>
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
        </div>

        {/* Manage modal (simple inline panel) */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={closeManage} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 max-w-lg w-full rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Manage access — {editing.name}</h3>
                <button onClick={closeManage} className="text-gray-300">Close</button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-2">Shared with</p>
                <div className="space-y-2">
                  {(editing.sharedWith || []).map((s) => (
                    <div key={s} className="flex items-center justify-between p-2 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                      <div className="text-sm text-gray-200">{s}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400">read</div>
                        <button onClick={() => revokeShare(editing.id, s)} className="px-2 py-1 rounded-md text-sm" style={{ background: 'rgba(255,255,255,0.02)', color: '#ef4444' }}>Revoke</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-2">Add wallet or email</p>
                <div className="flex gap-2">
                  <input value={shareTarget} onChange={(e) => setShareTarget(e.target.value)} placeholder="0xAbC... or user@example.com" className="flex-1 px-3 py-2 rounded-md" style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }} />
                  <select value={permission} onChange={(e) => setPermission(e.target.value)} className="px-3 py-2 rounded-md">
                    <option value="read">Read</option>
                    <option value="write">Read & Write</option>
                  </select>
                  <button onClick={addShare} className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>Share</button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={closeManage} className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AccessControl;
