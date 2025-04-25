// src/components/utils/AuthDebugger.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/apiUtils';

const AuthDebugger = () => {
  const [authToken, setAuthToken] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    setAuthToken(token || '');
  }, []);

  const testAuth = async () => {
    setLoading(true);
    setError(null);
    setApiResponse(null);
    
    try {
      // Test the API endpoint
      const response = await api.get('/interviews');
      setApiResponse(response.data);
    } catch (err) {
      console.error('Auth test failed:', err);
      setError({
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = () => {
    // Get the current token and ensure it has the Bearer prefix
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Update localStorage
    localStorage.setItem('token', formattedToken);
    
    // Update Axios default headers
    api.defaults.headers.common['Authorization'] = formattedToken;
    
    // Update state
    setAuthToken(formattedToken);
    
    console.log('Token refreshed:', formattedToken);
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-bold mb-4">Auth Debugger</h2>
      
      <div className="mb-4">
        <p className="font-medium mb-2">Current Auth Token:</p>
        <div className="p-2 bg-gray-100 rounded overflow-auto max-h-20 text-xs">
          {authToken || 'No token found'}
        </div>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={testAuth}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Auth'}
        </button>
        
        <button
          onClick={refreshToken}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Refresh Token Format
        </button>
      </div>
      
      {error && (
        <div className="mb-4">
          <p className="font-medium text-red-600 mb-2">Error:</p>
          <div className="p-2 bg-red-50 rounded border border-red-200">
            <p className="text-sm"><strong>Message:</strong> {error.message}</p>
            {error.status && <p className="text-sm"><strong>Status:</strong> {error.status}</p>}
            {error.data && (
              <div className="mt-2">
                <p className="text-sm"><strong>Response Data:</strong></p>
                <pre className="text-xs mt-1 p-2 bg-red-100 rounded overflow-auto max-h-40">
                  {JSON.stringify(error.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
      
      {apiResponse && (
        <div>
          <p className="font-medium text-green-600 mb-2">Success Response:</p>
          <pre className="text-xs p-2 bg-green-50 rounded border border-green-200 overflow-auto max-h-60">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;