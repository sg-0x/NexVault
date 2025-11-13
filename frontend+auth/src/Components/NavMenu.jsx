// src/Components/NavMenu.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Upload, Shield, User as UserIcon } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { logoutUser } from '../services/authService';

// utility: convert name -> path
const toPath = (name) =>
  '/' +
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

// menu
const rawMenu = [
  { name: 'Dashboard', icon: Home },
  { name: 'Upload File', icon: Upload },
  { name: 'Access Control', icon: Shield },
];

const menuItems = rawMenu.map((m) => ({ ...m, path: toPath(m.name) }));

// ensure Google images are requested at a sensible size
const sizedPhotoURL = (url, size = 128) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('sz')) u.searchParams.set('sz', String(size));
    return u.toString();
  } catch (e) {
    return url.includes('?') ? `${url}&sz=${size}` : `${url}?sz=${size}`;
  }
};

const NavMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultPath = toPath('Dashboard');

  const [activeMenu, setActiveMenu] = useState(() => {
    // initial from current location
    const p = (typeof window !== 'undefined' && window.location.pathname) || defaultPath;
    const match = menuItems.find((mi) => mi.path === p);
    return match ? match.name : 'Dashboard';
  });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [photoURL, setPhotoURL] = useState(null);
  const [displayName, setDisplayName] = useState(null);

  // auth listener for profile photo
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const sized = sizedPhotoURL(user.photoURL, 128);
        setPhotoURL(sized);
        setDisplayName(user.displayName || null);
      } else {
        setPhotoURL(null);
        setDisplayName(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // sync active menu with react-router location changes
  useEffect(() => {
    const p = location.pathname || defaultPath;
    // Don't set active menu for Profile or Settings pages
    if (p === '/profile' || p === '/settings') {
      setActiveMenu(null);
      return;
    }
    const match = menuItems.find((mi) => mi.path === p);
    const newActive = match ? match.name : 'Dashboard';
    setActiveMenu(newActive);

    // attempt to scroll to element matching path (if any)
    const id = p.replace(/^\//, '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    // otherwise keep page scroll at top - React Router will render new component
    // (no manual pushState required)
  }, [location.pathname]);

  const handleNavigation = (item) => {
    // navigate through react-router so route components mount properly
    setActiveMenu(item.name);
    if (location.pathname !== item.path) {
      navigate(item.path);
    } else {
      // same path: still try to scroll to section or top
      const id = item.path.replace(/^\//, '');
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsProfileOpen(false);
  };

  const handleProfileAction = async (item) => {
    setIsProfileOpen(false);
    if (item === 'Logout') {
      const res = await logoutUser();
      // ignore error for now but you can show a toast if needed
      navigate('/login');
    } else if (item === 'Profile') {
      navigate('/profile');
    } else if (item === 'Settings') {
      navigate('/settings');
    }
  };

  // create initials from displayName (if present)
  const initials = React.useMemo(() => {
    if (!displayName) return null;
    const parts = displayName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [displayName]);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-8 py-4"
      style={{
        background: 'rgba(9, 8, 13, 1)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          className="flex items-center space-x-3 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            handleNavigation({ name: 'Dashboard', path: defaultPath });
          }}
        >
          <img src="/logo.png" alt="logo" className="w-12 h-12 rounded-lg flex items-center justify-center" />
          <span className="text-2xl font-bold text-white tracking-tight">NexVault</span>
        </motion.div>

        <div className="flex items-center space-x-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.name && activeMenu !== null;

            return (
              <motion.button
                key={item.name}
                onClick={() => handleNavigation(item)}
                className="relative px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-all"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  color: isActive ? '#13ba82' : 'white',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBackground"
                    className="absolute inset-0 bg-white rounded-lg shadow-lg"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="font-medium relative z-10">{item.name}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="relative">
          <motion.button
            onClick={() => setIsProfileOpen((s) => !s)}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
            }}
            aria-haspopup="true"
            aria-expanded={isProfileOpen}
            aria-label="Profile menu"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName ? `${displayName} profile` : 'Profile'}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  setPhotoURL(null);
                }}
              />
            ) : initials ? (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium bg-gray-100 text-gray-800">
                {initials}
              </div>
            ) : (
              <UserIcon className="w-6 h-6" style={{ color: '#4664ab' }} />
            )}
          </motion.button>

          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden"
            >
              {['Profile', 'Settings', 'Logout'].map((item, index) => (
                <motion.button
                  key={item}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  whileHover={{ x: 5 }}
                  onClick={() => handleProfileAction(item)}
                  style={{
                    color: item === 'Logout' ? '#ef4444' : '#374151',
                  }}
                >
                  {item}
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.3) 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 0%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.nav>
  );
};

export default NavMenu;
