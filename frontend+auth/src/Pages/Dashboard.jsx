import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Clock, Upload, Shield, Wallet } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

const humanSize = (gb) => `${gb.toFixed(1)} GB`;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState({ name: 'Pro', quotaGB: 200, usedGB: 37.5, renewalDate: '2025-12-01' });
  const [recent, setRecent] = useState([]);
  const [nodeHealth, setNodeHealth] = useState({ replicas: 3, online: 3 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser({ displayName: u.displayName || 'User', email: u.email, photoURL: u.photoURL });
      else setUser(null);
    });

    // stub recent activity
    setRecent([
      { id: 1, text: 'Uploaded report.pdf', time: '10m ago' },
      { id: 2, text: 'Created share link for photos.zip', time: '2h ago' },
      { id: 3, text: 'Rotated encryption key', time: '1 day ago' },
    ]);

    // stub node health
    setNodeHealth({ replicas: 3, online: 2 });

    return () => unsub();
  }, []);

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
              onClick={() => alert('Open Upload')}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}
            >
              Quick Upload
            </button>
            <button
              onClick={() => alert('Open Access Control')}
              className="px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}
            >
              Manage Access
            </button>
          </div>
        </div>

        {/* Top summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <PieChart className="w-6 h-6 text-white" />
                <div>
                  <p className="text-sm text-gray-300">Storage</p>
                  <p className="text-lg font-semibold text-white">{humanSize(plan.usedGB)} / {humanSize(plan.quotaGB)}</p>
                </div>
              </div>
              <div className="text-sm text-gray-400">Renew: {plan.renewalDate}</div>
            </div>
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(plan.usedGB / Math.max(1, plan.quotaGB)) * 100}%`, background: 'linear-gradient(90deg, #13ba82, #0fa070)' }} />
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-6 h-6 text-white" />
              <div>
                <p className="text-sm text-gray-300">Uploads</p>
                <p className="text-lg font-semibold text-white">12 (last 7 days)</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">Avg. upload time: 22s</p>
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
            <h2 className="text-lg font-semibold text-white mb-4">Recent activity</h2>
            <div className="space-y-3">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <p className="text-white">{r.text}</p>
                    <p className="text-sm text-gray-400">{r.time}</p>
                  </div>
                  <div className="text-sm text-gray-300">View</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom quick actions */}
        <div className="mt-6 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => window.location.assign('/upload-file')} className="px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
              <Clock className="inline-block mr-2" /> Upload File
            </button>
            <button onClick={() => window.location.assign('/access-control')} className="px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
              <Shield className="inline-block mr-2" /> Manage Access
            </button>
            <button onClick={() => alert('Open Profile')} className="px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>
              <Wallet className="inline-block mr-2" /> Wallets
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
