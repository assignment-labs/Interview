// src/utils/authUtils.js
import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Handle login process with proper authentication
export const handleLogin = async (email, password) => {
  try {
    // Make direct API call to login endpoint
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });

    const { success, token, user } = response.data;

    if (success && token) {
      // Ensure token has Bearer prefix
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Store token and user in localStorage
      localStorage.setItem('token', formattedToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Set the auth token for axios default instance
      axios.defaults.headers.common['Authorization'] = formattedToken;
      
      console.log('Login successful, token set:', formattedToken);

      // Return success and user
      return { success: true, user };
    }
    
    return { success: false, error: 'Invalid response from server' };
  } catch (err) {
    console.error('Login failed:', err);
    return { 
      success: false, 
      error: err.response?.data?.message || 'Login failed. Please try again.'
    };
  }
};

// Check auth status - SIMPLIFIED without verification endpoint
export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      return { isAuthenticated: false };
    }
    
    // Ensure token has Bearer prefix
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Update localStorage and axios headers with properly formatted token
    localStorage.setItem('token', formattedToken);
    axios.defaults.headers.common['Authorization'] = formattedToken;
    
    // Parse user from localStorage
    const user = JSON.parse(storedUser);
    
    // Since the /auth/verify endpoint doesn't exist, we'll trust the stored token
    // This is not as secure, but works for development
    return { isAuthenticated: true, user };
    
  } catch (err) {
    console.error('Auth status check failed:', err);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { isAuthenticated: false };
  }
};

// Redirect based on user role
export const redirectBasedOnRole = (user, navigate) => {
  if (!user) return;
  
  console.log('Redirecting based on role:', user.role);
  
  if (user.role === 'jobseeker') {
    navigate('/dashboard/seeker');
  } else if (user.role === 'employer') {
    navigate('/dashboard/employer');
  } else {
    // Default fallback
    navigate('/');
  }
};

// Logout function
export const logout = (navigate) => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
  
  if (navigate) {
    navigate('/login');
  }
};