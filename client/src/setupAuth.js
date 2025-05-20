// src/setupAuth.js
import axios from 'axios';

// Set up the interceptors and default headers for authentication
const setupAuth = () => {
  // Read token from localStorage
  const token = localStorage.getItem('token');
  
  if (token) {
    // Ensure token has Bearer prefix
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Update localStorage with properly formatted token
    localStorage.setItem('token', formattedToken);
    
    // Set axios default authorization header
    axios.defaults.headers.common['Authorization'] = formattedToken;
    
    console.log('Authentication setup complete: token configured for API requests');
  }
  
  // Add a request interceptor
  axios.interceptors.request.use(
    config => {
      // Get fresh token before each request
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        config.headers['Authorization'] = currentToken;
      }
      return config;
    },
    error => Promise.reject(error)
  );
  
  // Add a response interceptor to handle 401 errors
  axios.interceptors.response.use(
    response => response,
    error => {
      // Handle authentication errors (401)
      if (error.response && error.response.status === 401) {
        console.warn('Authentication failed: 401 Unauthorized');
        
        // Only redirect if we're not already on an auth page
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
          console.log('Redirecting to login due to 401 error');
          // Clear auth data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Delay the redirect slightly to prevent infinite loops
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
      return Promise.reject(error);
    }
  );
};

// Execute the setup
setupAuth();

export default setupAuth;