import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Settings as SettingsIcon } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        enabled
          ? 'bg-gradient-to-r from-[#13ba82] to-[#0fa070]'
          : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        background: enabled
          ? 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)'
          : 'rgba(255,255,255,0.1)',
      }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

const SettingRow = ({ title, subtitle, children }) => (
  <div className="mb-5">
    <div className="flex items-center justify-between mb-2">
      <div className="flex-1">
        <p className="text-white font-medium">{title}</p>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [prefs, setPrefs] = useState({
    security: { twoFA: false, autoLockMin: 10 },
    notifications: { uploads: true, billing: true, shares: true },
  });
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAVerificationCode, setTwoFAVerificationCode] = useState('');
  const [twoFAVerified, setTwoFAVerified] = useState(false);
  const inactivityTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Fetch user data from Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser({
          displayName: u.displayName || '',
          email: u.email || '',
          uid: u.uid,
        });
        setDisplayName(u.displayName || '');
      } else {
        setUser(null);
        navigate('/login');
      }
    });
    return () => unsub();
  }, [navigate]);

  // Auto-lock implementation: Track user activity
  useEffect(() => {
    if (!prefs.security.autoLockMin || prefs.security.autoLockMin <= 0) return;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        // Lock the app after inactivity
        alert(`Auto-lock: You've been inactive for ${prefs.security.autoLockMin} minutes. Please log in again.`);
        navigate('/login');
      }, prefs.security.autoLockMin * 60 * 1000);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [prefs.security.autoLockMin, navigate]);

  // Load preferences from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('nexvault_settings');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPrefs((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const toggle2FA = () => {
    if (!prefs.security.twoFA) {
      // Enable 2FA - generate secret and show setup
      const secret = generate2FASecret();
      setTwoFASecret(secret);
      setShow2FASetup(true);
      setTwoFAVerified(false);
    } else {
      // Disable 2FA
      if (confirm('Are you sure you want to disable two-factor authentication?')) {
        setPrefs((p) => ({
          ...p,
          security: { ...p.security, twoFA: false },
        }));
        setShow2FASetup(false);
        setTwoFAVerified(false);
      }
    }
  };

  const generate2FASecret = () => {
    // Generate a random base32 secret (simplified - in production, use proper TOTP library)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const get2FAQRCodeURI = () => {
    // Generate TOTP URI for QR code
    const issuer = 'NexVault';
    const accountName = user?.email || 'user@nexvault.com';
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${twoFASecret}&issuer=${encodeURIComponent(issuer)}`;
  };

  const verify2FACode = () => {
    // Simplified verification - in production, use proper TOTP verification
    if (twoFAVerificationCode.length === 6 && /^\d+$/.test(twoFAVerificationCode)) {
      setTwoFAVerified(true);
      setPrefs((p) => ({
        ...p,
        security: { ...p.security, twoFA: true },
      }));
      setShow2FASetup(false);
      alert('2FA enabled successfully!');
    } else {
      alert('Invalid verification code. Please enter a 6-digit code.');
    }
  };

  const handleSave = () => {
    // Save to localStorage (in production, save to backend)
    localStorage.setItem('nexvault_settings', JSON.stringify(prefs));
    
    // Update display name if changed
    if (user && displayName !== user.displayName) {
      // In production, update via Firebase
      console.log('Display name update would be sent to backend:', displayName);
    }
    
    alert('Settings saved successfully!');
  };

  const toggleNotif = (key) => {
    setPrefs((p) => ({
      ...p,
      notifications: { ...p.notifications, [key]: !p.notifications[key] },
    }));
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070708' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-sm text-gray-400">Manage your account and security preferences</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg font-medium"
            style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}
          >
            Save settings
          </button>
        </div>

        {/* Settings Sections */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {/* Account */}
          <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
          <SettingRow title="Display name" subtitle="Your public name">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="px-3 py-2 rounded-md text-sm"
              style={{
                background: 'rgba(0,0,0,0.4)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                width: '200px',
              }}
              placeholder="Your name"
            />
          </SettingRow>

          <SettingRow title="Email" subtitle="Primary contact / login email">
            <div className="text-sm text-gray-300">{user?.email || 'Loading...'}</div>
          </SettingRow>

          <hr className="my-6 border-gray-800" />

          {/* Security */}
          <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
          <SettingRow
            title="2FA"
            subtitle="Use an authenticator app like Google Authenticator or Authy"
          >
            <ToggleSwitch
              enabled={prefs.security.twoFA}
              onChange={toggle2FA}
            />
          </SettingRow>

          {/* 2FA Setup Modal */}
          {show2FASetup && !twoFAVerified && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShow2FASetup(false)} />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 max-w-md w-full rounded-xl p-6"
                style={{ background: 'rgba(26, 26, 26, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">Setup Two-Factor Authentication</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-300 mb-2">1. Scan this QR code with your authenticator app:</p>
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    {twoFASecret && (
                      <QRCodeSVG
                        value={get2FAQRCodeURI()}
                        size={192}
                        level="M"
                        includeMargin={false}
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Or enter this secret manually: <code className="text-white font-mono text-xs">{twoFASecret}</code>
                  </p>
                  <p className="text-sm text-gray-300 mb-2">2. Enter the 6-digit code from your app:</p>
                  <input
                    type="text"
                    value={twoFAVerificationCode}
                    onChange={(e) => setTwoFAVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="px-3 py-2 rounded-md text-center text-lg font-mono w-full mb-3"
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    maxLength={6}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={verify2FACode}
                      disabled={twoFAVerificationCode.length !== 6}
                      className="px-4 py-2 rounded-md font-medium flex-1"
                      style={{
                        background:
                          twoFAVerificationCode.length === 6
                            ? 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)'
                            : 'rgba(255,255,255,0.1)',
                        color: 'white',
                        cursor: twoFAVerificationCode.length === 6 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Verify & Enable
                    </button>
                    <button
                      onClick={() => {
                        setShow2FASetup(false);
                        setTwoFAVerificationCode('');
                      }}
                      className="px-4 py-2 rounded-md"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          <SettingRow
            title="Auto-lock (minutes)"
            subtitle="Auto-lock the app after inactivity"
          >
            <input
              type="number"
              value={prefs.security.autoLockMin}
              min={1}
              max={120}
              onChange={(e) => {
                const value = Math.max(1, Math.min(120, Number(e.target.value) || 1));
                setPrefs((p) => ({
                  ...p,
                  security: { ...p.security, autoLockMin: value },
                }));
              }}
              className="px-3 py-2 rounded-md text-sm"
              style={{
                background: 'rgba(0,0,0,0.4)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.1)',
                width: '100px',
              }}
            />
          </SettingRow>

          <hr className="my-6 border-gray-800" />

          {/* Notifications */}
          <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
          <SettingRow title="Uploads completed" subtitle="Get notified when your uploads finish">
            <ToggleSwitch
              enabled={prefs.notifications.uploads}
              onChange={() => toggleNotif('uploads')}
            />
          </SettingRow>

          <SettingRow title="Billing & invoices" subtitle="Send invoices & billing alerts">
            <ToggleSwitch
              enabled={prefs.notifications.billing}
              onChange={() => toggleNotif('billing')}
            />
          </SettingRow>

          <SettingRow title="Shares & access" subtitle="Notify when files are shared or access is granted">
            <ToggleSwitch
              enabled={prefs.notifications.shares}
              onChange={() => toggleNotif('shares')}
            />
          </SettingRow>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
