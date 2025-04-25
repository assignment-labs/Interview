// src/utils/apiUtils.js
import axios from 'axios';

// Create axios instance with base URL
const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL
});

// Check for token in localStorage when the module is loaded
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  config => {
    // Refresh token from localStorage on each request (in case it was updated elsewhere)
    const token = localStorage.getItem('token');
    if (token) {
      // Make sure the token is prefixed with 'Bearer ' as expected by the protect middleware
      config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    // Log error details for debugging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('Error data:', error.response.data);
      console.log('Error status:', error.response.status);
      console.log('Error headers:', error.response.headers);
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.log('Unauthorized request - you may need to login again');
        // Optionally redirect to login page
        // window.location.href = '/login';
      }
      
      // Handle 500 server errors
      if (error.response.status === 500) {
        console.log('Server error - there might be an issue with the API endpoint');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error message:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export a function to set the auth token (to be called after login/registration)
export const setAuthToken = (token) => {
  if (token) {
    // Make sure the token is prefixed with 'Bearer ' as expected by the protect middleware
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    api.defaults.headers.common['Authorization'] = authToken;
    localStorage.setItem('token', authToken);
    
    // For debugging - log the token being set
    console.log('Auth token set:', authToken);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export default api;