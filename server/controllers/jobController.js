const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Employers only)
exports.createJob = async (req, res) => {
  try {
    // Add employer to req.body
    req.body.employer = req.user.id;

    // Check user is an employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({
        message: 'Only employers can create job listings'
      });
    }

    // Create job
    const job = await Job.create(req.body);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Job.find(JSON.parse(queryStr)).populate({
      path: 'employer',
      select: 'name companyName'
    });

    // Search functionality
    if (req.query.search) {
      query = Job.find({
        $text: { $search: req.query.search }
      }).populate({
        path: 'employer',
        select: 'name companyName'
      });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Job.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const jobs = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      pagination,
      data: jobs
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate({
      path: 'employer',
      select: 'name companyName companyDescription location website'
    });

    if (!job) {
      return res.status(404).json({
        message: `Job not found with ID: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer only)
exports.updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: `Job not found with ID: ${req.params.id}`
      });
    }

    // Make sure user is the job owner
    if (job.employer.toString() !== req.user.id) {
      return res.status(401).json({
        message: `User ${req.user.id} is not authorized to update this job`
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer only)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        message: `Job not found with ID: ${req.params.id}`
      });
    }

    // Make sure user is the job owner
    if (job.employer.toString() !== req.user.id) {
      return res.status(401).json({
        message: `User ${req.user.id} is not authorized to delete this job`
      });
    }

    await job.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get jobs posted by current employer
// @route   GET /api/jobs/employer
// @access  Private (Employer only)
exports.getEmployerJobs = async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({
        message: 'Only employers can access this route'
      });
    }

    const jobs = await Job.find({ employer: req.user.id });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};