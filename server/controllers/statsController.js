// controllers/statsController.js
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const InterviewResponse = require('../models/InterviewResponse');

// @desc    Get platform statistics
// @route   GET /api/stats
// @access  Public
exports.getStats = async (req, res) => {
  try {
    // Get total jobs count
    const jobsCount = await Job.countDocuments();
    
    // Get total employers count
    const employersCount = await User.countDocuments({ role: 'employer' });
    
    // Get total job seekers count
    const jobSeekersCount = await User.countDocuments({ role: 'jobseeker' });
    
    // Get total applications count
    const applicationsCount = await Application.countDocuments();
    
    // Get total interviews conducted
    const interviewsCount = await Interview.countDocuments();
    
    res.status(200).json({
      success: true,
      data: {
        jobsCount,
        employersCount,
        jobSeekersCount,
        applicationsCount,
        interviewsCount
      }
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

// @desc    Get job-related statistics
// @route   GET /api/stats/jobs
// @access  Public
exports.getJobStats = async (req, res) => {
  try {
    // Get job counts by category
    const jobsByCategory = await Job.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get job counts by location
    const jobsByLocation = await Job.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get recent job posting trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const jobPostingTrend = await Job.aggregate([
      { 
        $match: { 
          createdAt: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Format the trend data
    const formattedTrend = jobPostingTrend.map(item => ({
      date: `${item._id.year}-${item._id.month}`,
      count: item.count
    }));
    
    res.status(200).json({
      success: true,
      data: {
        jobsByCategory,
        jobsByLocation,
        jobPostingTrend: formattedTrend
      }
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