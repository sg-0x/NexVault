import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Settings as SettingsIcon, Bell, CreditCard, Key, Code } from 'lucide-react';

const SettingRow = ({ title, subtitle, children }) => (
  <div className="mb-5">
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="text-white font-medium">{title}</p>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  </div>
);

const Settings = () => {
  const [prefs, setPrefs] = useState({
    notifications: { uploads: true, billing: true, shares: true },
    security: { twoFA: false, webauthn: false, autoLockMin: 10 },
    storage: { defaultClass: 'hot', autoPin: true, replicationFactor: 3 },
    sharing: { defaultExpiryDays: 7, linkPermission: 'read', requireAuthForDownload: true },
    integrations: { webhooks: [], apiKeys: [{ id: 'k1', name: 'CLI key', createdAt: '2025-10-01' }] },
  });

  // pretend load preferences from API
  useEffect(() => {
    // fetch('/api/user/settings').then(...)
  }, []);

  const toggleNotif = (key) => {
    setPrefs((p) => ({ ...p, notifications: { ...p.notifications, [key]: !p.notifications[key] } }));
  };

  const toggleSecurity = (key) => {
    setPrefs((p) => ({ ...p, security: { ...p.security, [key]: !p.security[key] } }));
  };

  const handleSave = () => {
    // send prefs to backend
    // api.saveSettings(prefs)
    alert('Settings saved (hook this to API).');
  };

  const addApiKey = () => {
    const newKey = { id: `k${Date.now()}`, name: `Key ${prefs.integrations.apiKeys.length + 1}`, createdAt: new Date().toISOString().slice(0, 10) };
    setPrefs((p) => ({ ...p, integrations: { ...p.integrations, apiKeys: [...p.integrations.apiKeys, newKey] } }));
  };

  const revokeApiKey = (id) => {
    setPrefs((p) => ({ ...p, integrations: { ...p.integrations, apiKeys: p.integrations.apiKeys.filter(k => k.id !== id) } }));
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#070708' }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-sm text-gray-400">Manage your account, security, and integrations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} className="px-4 py-2 rounded-lg font-medium" style={{ background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)', color: 'white' }}>
              Save settings
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="rounded-xl p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {/* Account */}
          <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
          <SettingRow title="Display name" subtitle="Your public name">
            <input className="px-3 py-2 rounded-md" style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }} placeholder="Your name" />
          </SettingRow>

          <SettingRow title="Email" subtitle="Primary contact / login email">
            <div className="text-sm text-gray-300">ayu@example.com</div>
          </SettingRow>

          <hr className="my-4 border-gray-800" />

          {/* Security */}
          <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
          <SettingRow title="Two-factor authentication (TOTP)" subtitle="Use an authenticator app">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={prefs.security.twoFA} onChange={() => toggleSecurity('twoFA')} className="mr-2" />
              <span className="text-gray-300">{prefs.security.twoFA ? 'Enabled' : 'Disabled'}</span>
            </label>
          </SettingRow>

          <SettingRow title="WebAuthn / Security keys" subtitle="Use hardware keys or platform authenticators">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={prefs.security.webauthn} onChange={() => toggleSecurity('webauthn')} className="mr-2" />
              <span className="text-gray-300">{prefs.security.webauthn ? 'Enabled' : 'Disabled'}</span>
            </label>
          </SettingRow>

          <SettingRow title="Auto-lock (minutes)" subtitle="Auto-lock the app after inactivity">
            <input type="number" value={prefs.security.autoLockMin} min={1} onChange={(e) => setPrefs((p) => ({ ...p, security: { ...p.security, autoLockMin: Number(e.target.value) } }))} className="px-3 py-2 rounded-md w-24" />
          </SettingRow>

          <hr className="my-4 border-gray-800" />

          {/* Storage preferences */}
          <h2 className="text-lg font-semibold text-white mb-4">Storage Preferences</h2>
          <SettingRow title="Default class" subtitle="Hot for quick access, cold for cheaper archival">
            <select value={prefs.storage.defaultClass} onChange={(e) => setPrefs((p) => ({ ...p, storage: { ...p.storage, defaultClass: e.target.value } }))} className="px-3 py-2 rounded-md">
              <option value="hot">Hot</option>
              <option value="cold">Cold</option>
              <option value="archive">Archive</option>
            </select>
          </SettingRow>

          <SettingRow title="Auto-pin uploads" subtitle="Automatically pin uploaded files">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={prefs.storage.autoPin} onChange={() => setPrefs((p) => ({ ...p, storage: { ...p.storage, autoPin: !p.storage.autoPin } }))} className="mr-2" />
              <span className="text-gray-300">{prefs.storage.autoPin ? 'On' : 'Off'}</span>
            </label>
          </SettingRow>

          <SettingRow title="Replication factor" subtitle="Number of nodes to replicate to">
            <input type="range" min={1} max={5} value={prefs.storage.replicationFactor} onChange={(e) => setPrefs((p) => ({ ...p, storage: { ...p.storage, replicationFactor: Number(e.target.value) } }))} />
            <div className="text-sm text-gray-300 mt-1">Replication: {prefs.storage.replicationFactor} nodes</div>
          </SettingRow>

          <hr className="my-4 border-gray-800" />

          {/* Sharing defaults */}
          <h2 className="text-lg font-semibold text-white mb-4">Sharing Defaults</h2>
          <SettingRow title="Default link expiration (days)" subtitle="Default lifetime for generated share links">
            <input type="number" min={0} value={prefs.sharing.defaultExpiryDays} onChange={(e) => setPrefs((p) => ({ ...p, sharing: { ...p.sharing, defaultExpiryDays: Number(e.target.value) } }))} className="px-3 py-2 rounded-md w-28" />
          </SettingRow>

          <SettingRow title="Default link permission" subtitle="Permission applied to newly created links">
            <select value={prefs.sharing.linkPermission} onChange={(e) => setPrefs((p) => ({ ...p, sharing: { ...p.sharing, linkPermission: e.target.value } }))} className="px-3 py-2 rounded-md">
              <option value="read">Read</option>
              <option value="write">Read & Write</option>
            </select>
          </SettingRow>

          <SettingRow title="Require auth for downloads" subtitle="Force recipients to sign in before downloading">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={prefs.sharing.requireAuthForDownload} onChange={() => setPrefs((p) => ({ ...p, sharing: { ...p.sharing, requireAuthForDownload: !p.sharing.requireAuthForDownload } }))} className="mr-2" />
              <span className="text-gray-300">{prefs.sharing.requireAuthForDownload ? 'Yes' : 'No'}</span>
            </label>
          </SettingRow>

          <hr className="my-4 border-gray-800" />

          {/* Notifications */}
          <h2 className="text-lg font-semibold text-white mb-4">Notifications</h2>
          <SettingRow title="Uploads completed" subtitle="Get notified when your uploads finish">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={prefs.notifications.uploads} onChange={() => togglePref(setPrefs, 'notifications', 'uploads', prefs)} className="mr-2" />
              <span className="text-gray-300">{prefs.notifications.uploads ? 'On' : 'Off'}</span>
            </label>
          </SettingRow>

          <SettingRow title="Billing & invoices" subtitle="Send invoices & billing alerts">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={prefs.notifications.billing} onChange={() => togglePref(setPrefs, 'notifications', 'billing', prefs)} className="mr-2" />
              <span className="text-gray-300">{prefs.notifications.billing ? 'On' : 'Off'}</span>
            </label>
          </SettingRow>

          <hr className="my-4 border-gray-800" />

          {/* Integrations */}
          <h2 className="text-lg font-semibold text-white mb-4">Integrations & Developer</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-medium">API Keys</p>
                <p className="text-sm text-gray-400">Create and revoke API keys for CLI or integrations</p>
              </div>
              <div>
                <button onClick={addApiKey} className="px-3 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.03)', color: 'white' }}>Create Key</button>
              </div>
            </div>
            <div>
              {prefs.integrations.apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between mb-2 p-3 rounded-md" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <p className="text-white font-medium">{k.name}</p>
                    <p className="text-sm text-gray-400">Created: {k.createdAt}</p>
                  </div>
                  <div>
                    <button onClick={() => revokeApiKey(k.id)} className="px-3 py-1 rounded-md" style={{ background: 'rgba(255,255,255,0.02)', color: '#ef4444' }}>Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-400">Need custom integrations? Use webhooks or create scoped API keys for automation.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// small helper used in checkbox handlers
function togglePref(setter, group, key, current) {
  setter((p) => ({ ...p, [group]: { ...current[group], [key]: !current[group][key] } }));
}

export default Settings;
