const express = require('express');
const router = express.Router();
const {
  applyForJob,
  getApplication,
  getJobApplications,
  updateApplicationStatus,
  getMyApplications
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Routes
// Special routes must come BEFORE parameterized routes
router.get('/me', protect, authorize('jobseeker'), getMyApplications);
router.get('/job/:jobId', protect, authorize('employer'), getJobApplications);

// Generic CRUD operations with :id parameter
router.post('/:jobId', protect, authorize('jobseeker'), applyForJob);
router.put('/:id', protect, authorize('employer'), updateApplicationStatus);
router.get('/:id', protect, getApplication);

module.exports = router;