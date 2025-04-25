// controllers/savedJobController.js
const User = require('../models/User');
const Job = require('../models/Job');

// @desc    Save a job
// @route   POST /api/jobs/saved/:id
// @access  Private
exports.saveJob = async (req, res) => {
  try {
    // Check if job exists
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job not found with ID: ${req.params.id}`
      });
    }

    // Get user and update savedJobs array
    const user = await User.findById(req.user.id);

    // Check if job is already saved
    if (user.savedJobs && user.savedJobs.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Job is already saved'
      });
    }

    // If savedJobs array doesn't exist, create it
    if (!user.savedJobs) {
      user.savedJobs = [];
    }

    // Add job to savedJobs
    user.savedJobs.push(req.params.id);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Job saved successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Unsave a job
// @route   DELETE /api/jobs/saved/:id
// @access  Private
exports.unsaveJob = async (req, res) => {
  try {
    // Get user and update savedJobs array
    const user = await User.findById(req.user.id);

    // Check if job is saved
    if (!user.savedJobs || !user.savedJobs.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Job is not saved'
      });
    }

    // Remove job from savedJobs
    user.savedJobs = user.savedJobs.filter(
      job => job.toString() !== req.params.id
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Job removed from saved jobs'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get all saved jobs
// @route   GET /api/jobs/saved
// @access  Private
// controllers/savedJobController.js - getSavedJobs function
exports.getSavedJobs = async (req, res) => {
    try {
      // Check if user exists in the request
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
  
      // Get user
      const user = await User.findById(req.user.id);
  
      // If user not found in database
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      // If no saved jobs, return empty array
      if (!user.savedJobs || user.savedJobs.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
  
      // Get saved jobs
      const savedJobs = await Job.find({ _id: { $in: user.savedJobs } });
  
      res.status(200).json({
        success: true,
        count: savedJobs.length,
        data: savedJobs
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Server Error',
        error: err.message
      });
    }
  };