import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Wallet, PieChart, LogOut, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { logoutUser } from '../services/authService';
import { fetchUserFiles, getWalletAddresses, linkWalletAddress, unlinkWalletAddress } from '../services/api';

// Helper function to format storage size in MB
const formatStorageMB = (mb) => {
  if (mb < 1) {
    return `${(mb * 1024).toFixed(0)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState({ quotaMB: 5120, usedMB: 0 }); // 5 GB = 5120 MB
  const [connectedWallets, setConnectedWallets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLinkWallet, setShowLinkWallet] = useState(false);
  const [walletAddressInput, setWalletAddressInput] = useState('');
  const [linkingWallet, setLinkingWallet] = useState(false);

  useEffect(() => {
    // Listen to Firebase auth state for profile info (photo/displayName/email)
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser({
          displayName: u.displayName || 'Unnamed',
          email: u.email || '',
          photoURL: u.photoURL || null,
          uid: u.uid,
        });

        // Fetch actual storage data
        try {
          const userFiles = await fetchUserFiles();
          const totalUsedMB = userFiles.reduce((sum, file) => {
            const fileSize = file.originalSizeMB || file.encryptedSizeMB || 0;
            return sum + fileSize;
          }, 0);
          setPlan((prev) => ({
            ...prev,
            usedMB: totalUsedMB,
          }));
        } catch (error) {
          console.error('Failed to fetch files for storage:', error);
        }

        // Fetch active sessions from Firebase (if available)
        // For now, we'll use a placeholder that shows current session
        const browserInfo = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)?.[0] || 'Browser';
        const deviceType = navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';
        const currentSession = {
          id: 'current',
          device: `${deviceType}: ${browserInfo}`,
          lastSeen: new Date().toLocaleString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }).replace(',', ''),
        };
        setSessions([currentSession]);
      } else {
        setUser(null);
      }
    });

    // Load connected wallets from backend
    const loadWallets = async () => {
      try {
        const addresses = await getWalletAddresses();
        setConnectedWallets(
          addresses.map((addr) => ({
            chain: 'ethereum',
            address: addr,
            label: 'MetaMask',
            verified: true,
          }))
        );
      } catch (error) {
        console.error('Failed to load wallet addresses:', error);
        // Fallback to empty array
        setConnectedWallets([]);
      }
    };
    loadWallets();

    return () => unsub();
  }, []);

  const handleRevokeSession = (id) => {
    setSessions((s) => s.filter((x) => x.id !== id));
    // call API to revoke session
  };

  const handleDisconnectWallet = async (addr) => {
    try {
      await unlinkWalletAddress(addr);
    setConnectedWallets((w) => w.filter((x) => x.address !== addr));
      alert('Wallet address unlinked successfully');
    } catch (error) {
      console.error('Failed to unlink wallet:', error);
      alert(`Failed to unlink wallet: ${error.message}`);
    }
  };

  const handleLinkWallet = async () => {
    if (!walletAddressInput || !/^0x[a-fA-F0-9]{40}$/.test(walletAddressInput)) {
      alert('Please enter a valid Ethereum address (0x followed by 40 hex characters)');
      return;
    }

    setLinkingWallet(true);
    try {
      await linkWalletAddress(walletAddressInput);
      setConnectedWallets((w) => [
        ...w,
        {
          chain: 'ethereum',
          address: walletAddressInput,
          label: 'MetaMask',
          verified: true,
        },
      ]);
      setWalletAddressInput('');
      setShowLinkWallet(false);
      alert('Wallet address linked successfully!');
    } catch (error) {
      console.error('Failed to link wallet:', error);
      alert(`Failed to link wallet: ${error.message}`);
    } finally {
      setLinkingWallet(false);
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3 mb-3">
                <PieChart className="w-6 h-6 text-white" />
                <div>
                  <p className="text-sm text-gray-300">Storage</p>
                <p className="text-lg font-semibold text-white">{formatStorageMB(plan.usedMB)} / {formatStorageMB(plan.quotaMB)}</p>
              </div>
            </div>
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(plan.usedMB / Math.max(1, plan.quotaMB)) * 100}%`,
                  background: 'linear-gradient(90deg, #13ba82, #0fa070)',
                }}
              />
            </div>
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
                <div>
                <p className="text-white font-medium">{formatStorageMB(plan.usedMB)} used</p>
                <p className="text-sm text-gray-400">Total quota: {formatStorageMB(plan.quotaMB)}</p>
              </div>
            </section>

            {/* Sharing overview */}
            <section className="mb-6">
              <h3 className="text-sm text-gray-300 mb-2">Sharing</h3>
              <p className="text-sm text-gray-400">
                Manage file access permissions and shared addresses
              </p>
              <div className="mt-3">
                <button
                  className="px-3 py-2 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}
                  onClick={() => window.location.assign('/access-control')}
                >
                  Manage Shares
                </button>
              </div>
            </section>

            {/* Connected wallets */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm text-gray-300">Connected Wallets</h3>
                <button
                  onClick={() => setShowLinkWallet(!showLinkWallet)}
                  className="px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}
                >
                  <Plus className="w-4 h-4" /> Link Wallet
                </button>
              </div>
              
              {showLinkWallet && (
                <div className="mb-3 p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <input
                    type="text"
                    value={walletAddressInput}
                    onChange={(e) => setWalletAddressInput(e.target.value)}
                    placeholder="0x742d35Cc6634C0532925a3b844..."
                    className="w-full px-3 py-2 rounded-md text-sm mb-2"
                    style={{ background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleLinkWallet}
                      disabled={linkingWallet}
                      className="px-3 py-1 rounded-md text-sm flex-1"
                      style={{
                        background: linkingWallet ? 'rgba(19,186,130,0.3)' : 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)',
                        color: 'white',
                        cursor: linkingWallet ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {linkingWallet ? 'Linking...' : 'Link'}
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkWallet(false);
                        setWalletAddressInput('');
                      }}
                      className="px-3 py-1 rounded-md text-sm"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {connectedWallets.length === 0 ? (
                <p className="text-gray-400">No wallets connected. Link a wallet to see files shared with you.</p>
              ) : (
                connectedWallets.map((w) => (
                  <div key={w.address} className="flex items-center justify-between mb-3 p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{w.label}</p>
                      <p className="text-sm text-gray-400 font-mono truncate">{w.address}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {w.verified ? <span className="text-green-400 text-sm">Verified</span> : <span className="text-yellow-400 text-sm">Unverified</span>}
                      <button
                        onClick={() => handleDisconnectWallet(w.address)}
                        className="px-3 py-1 rounded-md text-sm"
                        style={{ background: 'rgba(255,255,255,0.02)', color: '#ef4444' }}
                      >
                        <X className="w-4 h-4" />
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
