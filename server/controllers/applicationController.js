const Application = require('../models/Application');
const Job = require('../models/Job');

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (Job seekers only)
exports.applyForJob = async (req, res) => {
  try {
    // Check if job exists
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        message: `Job not found with ID: ${req.params.jobId}`
      });
    }

    // Check if user is a job seeker
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can apply for jobs'
      });
    }

    // Check if user has already applied for this job
    const existingApplication = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'You have already applied for this job'
      });
    }

    // Create new application
    const application = await Application.create({
      job: req.params.jobId,
      applicant: req.user.id,
      coverLetter: req.body.coverLetter,
      resume: req.body.resume
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get a specific application by ID
// @route   GET /api/applications/:id
// @access  Private (Owner or employer of the job)
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate({
        path: 'applicant',
        select: 'name email phone location skills bio experience education'
      })
      .populate({
        path: 'job',
        select: 'title company location jobType employer'
      });

    if (!application) {
      return res.status(404).json({
        message: `Application not found with ID: ${req.params.id}`
      });
    }

    // Security check - Only the applicant or the employer can view this application
    const isApplicant = application.applicant._id.toString() === req.user.id;
    const isEmployer = application.job.employer.toString() === req.user.id;

    if (!isApplicant && !isEmployer) {
      return res.status(403).json({
        message: 'You are not authorized to view this application'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get all applications for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer only)
exports.getJobApplications = async (req, res) => {
  try {
    // Check if job exists
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        message: `Job not found with ID: ${req.params.jobId}`
      });
    }

    // Check if user is the job owner
    if (job.employer.toString() !== req.user.id) {
      return res.status(401).json({
        message: `User ${req.user.id} is not authorized to view applications for this job`
      });
    }

    // Get applications
    const applications = await Application.find({ job: req.params.jobId })
      .populate({
        path: 'applicant',
        select: 'name email phone location skills bio experience education'
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id
// @access  Private (Employer only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    let application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: `Application not found with ID: ${req.params.id}`
      });
    }

    // Find the job
    const job = await Job.findById(application.job);

    // Check if user is the job owner
    if (job.employer.toString() !== req.user.id) {
      return res.status(401).json({
        message: `User ${req.user.id} is not authorized to update this application`
      });
    }

    // Check if status is valid
    const validStatuses = ['pending', 'reviewing', 'rejected', 'shortlisted', 'accepted'];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({
        message: `Status must be one of ${validStatuses.join(', ')}`
      });
    }

    // Update application
    application = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate({
      path: 'applicant',
      select: 'name email'
    });

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get all applications for current job seeker
// @route   GET /api/applications/me
// @access  Private (Job seeker only)
exports.getMyApplications = async (req, res) => {
  try {
    // Check if user is a job seeker
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({
        message: 'Only job seekers can access this route'
      });
    }

    // Get applications
    const applications = await Application.find({ applicant: req.user.id })
      .populate({
        path: 'job',
        select: 'title company location jobType createdAt'
      });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server Error',
      error: err.message
    });
  }
};