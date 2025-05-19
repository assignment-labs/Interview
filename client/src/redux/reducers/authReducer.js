// src/redux/reducers/authReducer.js
import { LOGIN_SUCCESS, REGISTER_SUCCESS, LOGOUT, AUTH_ERROR } from '../actions/types';

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true
};

const getInitialUser = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user);
    } catch (err) {
      console.error('Error parsing user from localStorage:', err);
    }
  }
  return null;
};

const initialUser = getInitialUser();
if (initialUser) {
  initialState.isAuthenticated = true;
  initialState.user = initialUser;
}

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_SUCCESS:
    case REGISTER_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false
      };
    case LOGOUT:
    case AUTH_ERROR:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false
      };
    default:
      return state;
  }
};

export default authReducer;