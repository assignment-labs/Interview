// src/utils/apiUtils.js
import axios from 'axios';

// Create axios instance with base URL
const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL
});

// Function to set the auth token
export const setAuthToken = (token) => {
  if (token) {
    // Ensure token has Bearer prefix
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Set token for this api instance
    api.defaults.headers.common['Authorization'] = formattedToken;
    
    // Also set for axios default instance
    axios.defaults.headers.common['Authorization'] = formattedToken;
    
    // Store in localStorage
    localStorage.setItem('token', formattedToken);
    
    console.log('Auth token set in apiUtils:', formattedToken);
  } else {
    // Clear token
    delete api.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Check for token on load and set it
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Add a request interceptor to refresh token from localStorage
api.interceptors.request.use(
  config => {
    // Get fresh token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = token;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 errors - token might be expired
    if (error.response && error.response.status === 401) {
      console.warn('Authentication error - token may be expired');
      
      // Only trigger logout if not already on auth pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.log('Redirecting to login due to 401 error');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;