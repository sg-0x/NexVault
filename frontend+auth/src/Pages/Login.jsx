import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, signInWithGoogle } from '../services/authService';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMetaMaskConnect = async () => {
    setLoading(true);
    try {
      // MetaMask connection logic
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        console.log('Connected account:', accounts[0]);
        // Handle successful connection
        navigate('/dashboard');
      } else {
        alert('Please install MetaMask to use this feature!');
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      alert('MetaMask connection failed. See console for details.');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result && result.success) {
        console.log('Google sign-in successful!', result.user);
        navigate('/dashboard');
      } else {
        // result.error may contain message
        const errMsg = result?.error || 'Google sign-in failed';
        console.warn('Google sign-in failed:', errMsg);
        alert(errMsg);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Google sign-in error. See console for details.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      if (isLogin) {
        // Firebase login
        const result = await loginUser(formData.email, formData.password);
        if (result && result.success) {
          console.log('Login successful!', result.user);
          navigate('/dashboard');
        } else {
          const err = result?.error || 'Login failed';
          console.warn('Login failed:', err);
          alert(err);
        }
      } else {
        // Firebase registration
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match!');
          setLoading(false);
          return;
        }
        const result = await registerUser(formData.email, formData.password);
        if (result && result.success) {
          console.log('Registration successful!', result.user);
          navigate('/dashboard');
        } else {
          const err = result?.error || 'Registration failed';
          console.warn('Registration failed:', err);
          alert(err);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication error. See console for details.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: '#0a0a0a' }}>
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: '#13ba82', top: '10%', left: '10%' }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: '#4664ab', bottom: '10%', right: '10%' }}
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center mb-8 space-x-3"
        >
          <Shield className="w-10 h-10" style={{ color: '#13ba82' }} />
          <h1 className="text-4xl font-bold text-white">NexVault</h1>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-2xl p-8 backdrop-blur-xl"
          style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-8">
            Securely Access Your Vault
          </h2>

          {/* MetaMask Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMetaMaskConnect}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-3 mb-4 font-medium transition-all"
            style={{
              background: 'rgba(45, 45, 45, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20.5 7.5L12 2L3.5 7.5L12 13L20.5 7.5Z" fill="#F6851B"/>
              <path d="M3.5 16.5L12 22L20.5 16.5L12 11L3.5 16.5Z" fill="#E2761B"/>
            </svg>
            <span>Connect with MetaMask</span>
          </motion.button>

          {/* Google Sign-In Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-3 mb-6 font-medium transition-all"
            style={{
              background: 'rgba(45, 45, 45, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white'
            }}
          >
            {/* simple Google "G" icon */}
            <svg width="20" height="20" viewBox="0 0 48 48" className="mr-1" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.9 0 6.7 1.6 8.2 2.9l6-6C34.9 4.1 30.9 2.5 24 2.5 14.9 2.5 7.4 7.9 4 15.2l7.4 5.7C12.8 16 17.8 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.5 24c0-1.6-.1-2.7-.4-3.9H24v7.4h12.8c-.6 3.3-2.6 6.1-5.6 8l8.5 6.6C44.4 36.5 46.5 30.9 46.5 24z"/>
              <path fill="#4A90E2" d="M11.4 28.9A14.6 14.6 0 0 1 10 24c0-1.9.3-3.6.9-5.2L4 13.1c-1.7 3.4-2.7 7.2-2.7 11 0 3.8 1 7.6 2.7 11l7.4-7.2z"/>
              <path fill="#FBBC05" d="M24 46.5c6.1 0 11.3-2.1 15-5.8l-7.3-5.6c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.4-4.9-12.6-11.3L4 34.1C7.4 41.4 14.9 46.5 24 46.5z"/>
            </svg>
            <span></span>
            <span>Sign in with Google</span>
          </motion.button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 text-gray-400" style={{ background: 'rgba(26, 26, 26, 0.8)' }}>OR</span>
            </div>
          </div>

          {/* Login/Register Tabs */}
          <div className="flex mb-6 rounded-lg p-1" style={{ background: 'rgba(45, 45, 45, 0.5)' }}>
            <button
              onClick={() => setIsLogin(true)}
              className="flex-1 py-2 rounded-md font-medium transition-all relative"
              style={{ color: isLogin ? 'white' : '#9ca3af' }}
            >
              {isLogin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-md"
                  style={{ background: '#13ba82' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Login</span>
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className="flex-1 py-2 rounded-md font-medium transition-all relative"
              style={{ color: !isLogin ? 'white' : '#9ca3af' }}
            >
              {!isLogin && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-md"
                  style={{ background: '#13ba82' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Register</span>
            </button>
          </div>

          {/* Form */}
          <div>
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      background: 'rgba(45, 45, 45, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-white">
                    Password
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-sm font-medium"
                      style={{ color: '#13ba82' }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      background: 'rgba(45, 45, 45, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Register only) */}
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium text-white mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className="w-full pl-11 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: 'rgba(45, 45, 45, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white mt-6 transition-all"
              style={{
                background: 'linear-gradient(135deg, #13ba82 0%, #0fa070 100%)',
                boxShadow: '0 4px 15px rgba(19, 186, 130, 0.4)'
              }}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </motion.button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium"
              style={{ color: '#13ba82' }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
