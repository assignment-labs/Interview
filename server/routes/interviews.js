// routes/interviews.js
const express = require('express');
const router = express.Router();
const { 
  createInterview, 
  getInterviews, 
  getInterview, 
  updateInterview, 
  deleteInterview,
  generateQuestions
} = require('../controllers/interviewController');

const {
  createResponse,
  getResponse,
  getAllResponses
} = require('../controllers/interviewResponseController');

const { protect } = require('../middleware/auth');

// Interview routes
router.route('/')
  .get(protect, getInterviews)
  .post(protect, createInterview);

router.route('/generate')
  .post(protect, generateQuestions);

router.route('/:id')
  .get(protect, getInterview)
  .put(protect, updateInterview)
  .delete(protect, deleteInterview);

// Interview response routes
router.route('/:id/responses')
  .get(protect, getResponse)
  .post(protect, createResponse);

router.route('/responses')
  .get(protect, getAllResponses);

module.exports = router;