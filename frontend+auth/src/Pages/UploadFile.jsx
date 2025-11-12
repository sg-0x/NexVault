import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Lock, Link as LinkIcon } from 'lucide-react';

// simple fake CID generator for demo
const fakeCID = (name) => `bafy${Math.random().toString(36).slice(2, 10)}${name.slice(0,3)}`;

const UploadFile = () => {
  const [files, setFiles] = useState([]);
  const [encrypt, setEncrypt] = useState(true);
  const [storageClass, setStorageClass] = useState('hot');
  const [replication, setReplication] = useState(3);
  const fileInputRef = useRef();

  const onDrop = (ev) => {
    ev.preventDefault();
    const dt = ev.dataTransfer;
    const incoming = Array.from(dt.files).map((f) => ({ file: f, progress: 0, cid: null, status: 'queued' }));
    setFiles((s) => [...incoming, ...s]);
    incoming.forEach(simulateUpload);
  };

  const onSelectFiles = (e) => {
    const incoming = Array.from(e.target.files).map((f) => ({ file: f, progress: 0, cid: null, status: 'queued' }));
    setFiles((s) => [...incoming, ...s]);
    incoming.forEach(simulateUpload);
  };

  const simulateUpload = (item) => {
    // Simple simulated upload timeline: increase progress then set cid
    const id = Math.random().toString(36).slice(2);
    item.id = id;
    item.status = 'uploading';
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      setFiles((list) => list.map((f) => (f.id === id ? { ...f, progress: Math.min(100, Math.round(progress)), status: progress >= 100 ? 'finalizing' : 'uploading' } : f)));
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const cid = fakeCID(item.file.name);
          setFiles((list) => list.map((f) => (f.id === id ? { ...f, progress: 100, cid, status: 'done' } : f)));
        }, 600);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070708' }}>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Upload Files</h1>
            <p className="text-sm text-gray-400">Drag & drop files, choose encryption and storage options.</p>
          </div>
          <div>
            <button onClick={() => fileInputRef.current.click()} className="px-4 py-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}>
              Select files
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onSelectFiles} />
          </div>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="rounded-xl p-6 mb-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center">
              <UploadCloud className="w-8 h-8 text-white" />
            </div>

            <div className="flex-1">
              <p className="text-white font-medium">Drop files here to upload</p>
              <p className="text-sm text-gray-400">Files will be {encrypt ? 'encrypted locally' : 'uploaded raw'} before being stored.</p>

              <div className="mt-4 flex items-center gap-3">
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={encrypt} onChange={() => setEncrypt((s) => !s)} className="mr-2" />
                  <span className="text-gray-300">Client-side encryption</span>
                </label>

                <select value={storageClass} onChange={(e) => setStorageClass(e.target.value)} className="px-3 py-1 rounded-md">
                  <option value="hot">Hot</option>
                  <option value="cold">Cold</option>
                  <option value="archive">Archive</option>
                </select>

                <div className="text-sm text-gray-300">Replication:</div>
                <input type="range" min={1} max={5} value={replication} onChange={(e) => setReplication(Number(e.target.value))} />
                <div className="text-sm text-gray-300">{replication} nodes</div>
              </div>
            </div>

            <div className="text-right">
              <button onClick={() => alert('Upload queued (integrate IPFS/API)')} className="px-3 py-2 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
                Upload Options
              </button>
            </div>
          </div>
        </div>

        {/* Upload queue */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Upload queue</h2>
          <div className="space-y-3">
            {files.length === 0 && <p className="text-gray-400">No files in queue. Drag files here or select files.</p>}
            {files.map((f) => (
              <div key={f.id || f.file.name} className="p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{f.file.name}</p>
                    <p className="text-sm text-gray-400">{(f.file.size / (1024*1024)).toFixed(2)} MB • {f.status}</p>
                    {f.cid && <p className="text-xs text-gray-300 mt-1">CID: <span className="font-mono text-sm text-white">{f.cid}</span></p>}
                  </div>
                  <div className="w-48">
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div style={{ width: `${f.progress}%`, height: '100%', background: 'linear-gradient(90deg, #13ba82, #0fa070)' }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigator.clipboard.writeText(f.cid || '')} className="px-2 py-1 rounded-md text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
                        <LinkIcon className="inline-block mr-2" /> Copy CID
                      </button>
                      <button onClick={() => alert('View on gateway (implement)')} className="px-2 py-1 rounded-md text-sm" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadFile;
