import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Wallet, PieChart, Database, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { logoutUser } from '../services/authService';

const humanSize = (gb) => `${gb.toFixed(1)} GB`;

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState({ name: 'Free', quotaGB: 5, usedGB: 1.2, renewalDate: '—' });
  const [connectedWallets, setConnectedWallets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isBackingUpKey, setIsBackingUpKey] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Listen to Firebase auth state for profile info (photo/displayName/email)
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({
          displayName: u.displayName || 'Unnamed',
          email: u.email || '',
          photoURL: u.photoURL || null,
          uid: u.uid,
        });
      } else {
        setUser(null);
      }
    });

    // load other user-specific data — replace with real fetches
    setConnectedWallets([
      { chain: 'ethereum', address: '0xAbC...123', label: 'MetaMask', verified: true },
    ]);
    setSessions([
      { id: 's1', device: 'Chrome — Macbook', lastSeen: '2025-11-10 10:12' },
      { id: 's2', device: 'Mobile — Android', lastSeen: '2025-11-09 22:03' },
    ]);
    setPlan({ name: 'Pro', quotaGB: 200, usedGB: 37.5, renewalDate: '2025-12-01' });

    return () => unsub();
  }, []);

  const handleBackupKey = async () => {
    setIsBackingUpKey(true);
    try {
      // Example: call to generate & download encrypted key
      // const res = await api.exportKey(user.uid);
      // download(res.blob, `nexvault-key-${user.uid}.json`);
      alert('Key export prepared — integrate real key-export flow here.');
    } catch (e) {
      console.error(e);
      alert('Key backup failed.');
    }
    setIsBackingUpKey(false);
  };

  const handleRevokeSession = (id) => {
    setSessions((s) => s.filter((x) => x.id !== id));
    // call API to revoke session
  };

  const handleDisconnectWallet = (addr) => {
    setConnectedWallets((w) => w.filter((x) => x.address !== addr));
    // call API to disconnect
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await logoutUser();
      if (res && res.success) {
        // navigate to login after successful logout
        navigate('/login');
      } else {
        console.error('Logout failed:', res?.error);
        // still navigate to login as a fallback
        navigate('/login');
      }
    } catch (err) {
      console.error('Unexpected logout error:', err);
      navigate('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070708' }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-700">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user?.displayName || 'Guest'}</h1>
              <p className="text-sm text-gray-300">{user?.email || 'No email connected'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackupKey}
              className="px-4 py-2 rounded-lg font-medium"
              style={{
                background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)',
                color: 'white',
                boxShadow: '0 6px 18px rgba(19,186,130,0.25)',
              }}
              disabled={isBackingUpKey}
            >
              {isBackingUpKey ? 'Preparing...' : 'Backup Encryption Key'}
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg flex items-center space-x-2"
              style={{
                background: 'rgba(255,255,255,0.03)',
                color: '#ef4444',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
              disabled={loggingOut}
            >
              <LogOut className="w-4 h-4" /> <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Top summary cards */}
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
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(plan.usedGB / Math.max(1, plan.quotaGB)) * 100}%`,
                  background: 'linear-gradient(90deg, #13ba82, #0fa070)',
                }}
              />
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-6 h-6 text-white" />
              <div>
                <p className="text-sm text-gray-300">Pinned Objects</p>
                <p className="text-lg font-semibold text-white">1,245</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">Replication: 3 nodes • Auto-pin: On</p>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-6 h-6 text-white" />
              <div>
                <p className="text-sm text-gray-300">Connected Wallets</p>
                <p className="text-lg font-semibold text-white">{connectedWallets.length}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">Default: {connectedWallets[0]?.label || '—'}</p>
          </div>
        </div>

        {/* Tabs: Overview + Security + Activity (simple layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Overview */}
          <div className="col-span-2 rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>

            {/* Storage section */}
            <section className="mb-6">
              <h3 className="text-sm text-gray-300 mb-2">Storage</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{humanSize(plan.usedGB)} used</p>
                  <p className="text-sm text-gray-400">Plan: {plan.name} • {plan.quotaGB} GB</p>
                </div>
                <button
                  className="px-3 py-1 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}
                  onClick={() => alert('Open upgrade flow')}
                >
                  Upgrade Plan
                </button>
              </div>
            </section>

            {/* Sharing overview */}
            <section className="mb-6">
              <h3 className="text-sm text-gray-300 mb-2">Sharing</h3>
              <p className="text-sm text-gray-400">
                Active shared links: <span className="text-white font-medium">4</span>.
                Default link permission: <span className="text-white font-medium">Read</span>
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  className="px-3 py-2 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}
                  onClick={() => alert('Open shares manager')}
                >
                  Manage Shares
                </button>
                <button
                  className="px-3 py-2 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.03)', color: '#13ba82' }}
                  onClick={() => alert('Create share link')}
                >
                  Create Share Link
                </button>
              </div>
            </section>

            {/* Connected wallets */}
            <section>
              <h3 className="text-sm text-gray-300 mb-3">Connected Wallets</h3>
              {connectedWallets.length === 0 ? (
                <p className="text-gray-400">No wallets connected.</p>
              ) : (
                connectedWallets.map((w) => (
                  <div key={w.address} className="flex items-center justify-between mb-3 p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div>
                      <p className="text-white font-medium">{w.label}</p>
                      <p className="text-sm text-gray-400">{w.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {w.verified ? <span className="text-green-400 text-sm">Verified</span> : <span className="text-yellow-400 text-sm">Unverified</span>}
                      <button
                        onClick={() => handleDisconnectWallet(w.address)}
                        className="px-3 py-1 rounded-md text-sm"
                        style={{ background: 'rgba(255,255,255,0.02)', color: '#ef4444' }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* Right column: Security & Sessions */}
          <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Security</h2>

            {/* Encryption status */}
            <div className="mb-4 p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5" />
                  <div>
                    <p className="text-white font-medium">Client-side Encryption</p>
                    <p className="text-sm text-gray-400">Your files are encrypted on your device before upload.</p>
                  </div>
                </div>
                <div className="text-sm text-gray-300">Enabled</div>
              </div>
              <div className="text-sm text-gray-400 mt-2">Key backup: <strong className="text-white ml-1">Backed up</strong></div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }} onClick={handleBackupKey}>Download Backup</button>
                <button className="px-3 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: '#ef4444' }} onClick={() => alert('Rotate key flow')}>Rotate Key</button>
              </div>
            </div>

            {/* Sessions */}
            <div>
              <h3 className="text-sm text-gray-300 mb-2">Active sessions</h3>
              {sessions.length === 0 ? (
                <p className="text-gray-400">No active sessions</p>
              ) : (
                sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between mb-3 p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div>
                      <p className="text-white font-medium">{s.device}</p>
                      <p className="text-sm text-gray-400">Last seen: {s.lastSeen}</p>
                    </div>
                    <button onClick={() => handleRevokeSession(s.id)} className="px-3 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.02)', color: '#ef4444' }}>Revoke</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
