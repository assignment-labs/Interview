const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Set token from Bearer token in header
      token = req.headers.authorization.split(' ')[1];
      
      // Log token for debugging (consider removing in production)
      console.log('Token extracted from auth header:', token ? token.substring(0, 15) + '...' : 'none');
    } else {
      console.log('No Bearer token in Authorization header');
    }

    // Check if token exists in cookies as fallback (optional)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Using token from cookies as fallback');
    }

    // Make sure token exists
    if (!token) {
      console.log('Authentication failed: No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - no authentication token'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`Token verified for user ID: ${decoded.id}`);

      // Get user from the token
      const user = await User.findById(decoded.id);
      
      // Check if user exists
      if (!user) {
        console.log(`User not found for ID: ${decoded.id}`);
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists'
        });
      }

      // Set user to req.user
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.name, jwtError.message);
      
      // Provide more specific error messages based on JWT error type
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your token has expired, please log in again',
          errorType: 'expired'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token, please log in again',
          errorType: 'invalid'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - token verification failed',
        errorType: jwtError.name
      });
    }
  } catch (err) {
    console.error('Auth middleware unexpected error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('Authorization failed: No user object in request');
      return res.status(403).json({
        success: false,
        message: 'User object not found in request'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`Authorization failed: User role '${req.user.role}' not in allowed roles:`, roles);
      return res.status(403).json({
        success: false,
        message: `Access denied: Your role (${req.user.role}) does not have permission to access this resource`
      });
    }
    
    console.log(`User authorized with role: ${req.user.role}`);
    next();
  };
};