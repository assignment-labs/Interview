// src/redux/actions/authActions.js
import api from '../../utils/apiUtils';

// Action Types
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const REGISTER_SUCCESS = 'REGISTER_SUCCESS';
export const LOGOUT = 'LOGOUT';
export const AUTH_ERROR = 'AUTH_ERROR';

// Action Creators
export const loginSuccess = (user) => ({
  type: LOGIN_SUCCESS,
  payload: user
});

export const registerSuccess = (user) => ({
  type: REGISTER_SUCCESS,
  payload: user
});

export const logout = () => {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  return {
    type: LOGOUT
  };
};

// Check user auth status
export const checkAuthStatus = () => async (dispatch) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      dispatch({ type: AUTH_ERROR });
      return;
    }
    
    // Verify token with backend
    const res = await api.get('/auth/verify');
    
    if (res.data.success) {
      const user = localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user')) 
        : res.data.user;
      
      dispatch(loginSuccess(user));
    } else {
      dispatch({ type: AUTH_ERROR });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch (err) {
    console.error('Auth verification failed:', err);
    dispatch({ type: AUTH_ERROR });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};