import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#070708' }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-300 mb-6">Page not found.</p>
        <Link to="/dashboard" className="px-4 py-2 rounded-md" style={{ background: '#13ba82', color: 'white' }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
