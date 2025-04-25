// routes/jobs.js
const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getEmployerJobs
} = require('../controllers/jobController');

const {
  saveJob,
  unsaveJob,
  getSavedJobs
} = require('../controllers/savedJobController');

const { protect, authorize } = require('../middleware/auth');

// Get saved jobs routes
router.get('/saved', protect, getSavedJobs);
router.post('/saved/:id', protect, saveJob);
router.delete('/saved/:id', protect, unsaveJob);

// Standard job routes
router.route('/')
  .get(getJobs)
  .post(protect, authorize('employer'), createJob);

router.route('/:id')
  .get(getJob)
  .put(protect, authorize('employer'), updateJob)
  .delete(protect, authorize('employer'), deleteJob);

router.get('/employer/me', protect, authorize('employer'), getEmployerJobs);

module.exports = router;