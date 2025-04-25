// routes/stats.js
const express = require('express');
const router = express.Router();
const { 
  getStats,
  getJobStats 
} = require('../controllers/statsController');
const { 
  getDashboardStats, 
  getPerformanceTrends 
} = require('../controllers/interviewStatsController');
const { protect } = require('../middleware/auth');

// Public stats route
router.get('/', getStats);
router.get('/jobs', getJobStats);

// Protected interview stats routes
router.get('/dashboard', protect, getDashboardStats);
router.get('/performance', protect, getPerformanceTrends);

module.exports = router;