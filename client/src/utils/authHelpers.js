// src/utils/authHelpers.js
import axios from 'axios';

/**
 * Ensures a token has the "Bearer " prefix
 * @param {string} token - The token to format
 * @returns {string} Properly formatted token with Bearer prefix
 */
export const formatToken = (token) => {
  if (!token) return null;
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

/**
 * Ensures auth token is set for all API requests
 * @returns {string|null} The formatted token or null if not available
 */
export const setupAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  // Format token
  const formattedToken = formatToken(token);
  
  // Update token in localStorage
  localStorage.setItem('token', formattedToken);
  
  // Set axios default authorization header
  axios.defaults.headers.common['Authorization'] = formattedToken;
  
  return formattedToken;
};

/**
 * Gets the current user from localStorage
 * @returns {object|null} User object or null if not found
 */
export const getCurrentUser = () => {
  try {
    const userString = localStorage.getItem('user');
    if (!userString) return null;
    return JSON.parse(userString);
  } catch (err) {
    console.error('Error parsing user from localStorage:', err);
    return null;
  }
};

/**
 * Handles token-related errors (like 401 Unauthorized)
 * @param {Error} error - The error object from axios
 * @param {Function} navigate - React Router's navigate function
 */
export const handleAuthError = (error, navigate) => {
  if (error.response?.status === 401) {
    console.warn('Authentication failed: 401 Unauthorized');
    
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login after a short delay
    if (navigate) {
      setTimeout(() => navigate('/login'), 1000);
    }
  }
};

/**
 * Sets up auth headers for API requests
 * @returns {object} Configuration object with auth headers
 */
export const getAuthConfig = () => {
  const token = setupAuthToken();
  
  if (!token) {
    return {};
  }
  
  return {
    headers: {
      'Authorization': token
    }
  };
};

/**
 * Sets up auth headers with JSON content type for API requests
 * @returns {object} Configuration object with auth and content-type headers
 */
export const getJsonAuthConfig = () => {
  const token = setupAuthToken();
  
  if (!token) {
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
  
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    }
  };
};

/**
 * Checks if the current user has a specific role
 * @param {string} role - The role to check for
 * @returns {boolean} True if user has the role, false otherwise
 */
export const hasRole = (role) => {
  const user = getCurrentUser();
  return user && user.role === role;
};

/**
 * Checks if user is authenticated
 * @returns {boolean} True if user is authenticated, false otherwise
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  return !!(token && user);
};

/**
 * Logs out the user
 * @param {Function} navigate - React Router's navigate function (optional)
 */
export const logout = (navigate) => {
  // Clear auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  
  // Redirect to login if navigate function is provided
  if (navigate) {
    navigate('/login');
  }
};

export default {
  formatToken,
  setupAuthToken,
  getCurrentUser,
  handleAuthError,
  getAuthConfig,
  getJsonAuthConfig,
  hasRole,
  isAuthenticated,
  logout
};