const express = require('express');
const router = express.Router();
const jobScraperController = require('../controllers/jobScraperController');

/**
 * @route   POST /api/cv/process
 * @desc    Process a CV file, extract information and find matching jobs
 * @access  Public
 */
router.post('/cv/process', jobScraperController.processCV.bind(jobScraperController));

/**
 * @route   POST /api/scrape-jobs
 * @desc    Scrape jobs based on profile information
 * @access  Public
 */
router.post('/scrape-jobs', jobScraperController.scrapeJobs.bind(jobScraperController));

module.exports = router;