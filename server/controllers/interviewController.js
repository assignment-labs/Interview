// controllers/interviewController.js
const Interview = require('../models/Interview');
const InterviewResponse = require('../models/InterviewResponse');
const geminiService = require('../services/geminiService');

// @desc    Create a new interview
// @route   POST /api/interviews
// @access  Private
exports.createInterview = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const { role, experience, techStack, difficulty } = req.body;

    // Validate input
    if (!role || !experience || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide role, experience, and difficulty'
      });
    }

    // Create interview with user ID from authentication middleware
    const interview = await Interview.create({
      user: req.user.id,
      role,
      experience,
      techStack: Array.isArray(techStack) ? techStack : [],
      difficulty,
      questions: [], // We'll generate these separately
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: interview
    });
  } catch (err) {
    console.error('Error creating interview:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get all interviews for logged in user
// @route   GET /api/interviews
// @access  Private
exports.getInterviews = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const interviews = await Interview.find({ user: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (err) {
    console.error('Error fetching interviews:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterview = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }

    // If interview has no questions yet, generate them now
    if (!interview.questions || interview.questions.length === 0) {
      try {
        const questions = await geminiService.generateInterviewQuestions({
          role: interview.role,
          experience: interview.experience,
          techStack: interview.techStack,
          difficulty: interview.difficulty
        });
        
        interview.questions = questions;
        await interview.save();
      } catch (error) {
        console.error('Failed to generate questions with Gemini:', error);
        // Continue anyway - we'll return the interview without questions
      }
    }

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (err) {
    console.error('Error fetching interview:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Update interview status (mark as completed) or add questions
// @route   PUT /api/interviews/:id
// @access  Private
exports.updateInterview = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    let interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this interview'
      });
    }

    // Update fields that were sent
    const { completed, questions } = req.body;
    
    if (completed !== undefined) {
      interview.completed = completed;
    }
    
    if (questions && Array.isArray(questions) && questions.length > 0) {
      interview.questions = questions;
    }

    await interview.save();

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (err) {
    console.error('Error updating interview:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Delete interview
// @route   DELETE /api/interviews/:id
// @access  Private
exports.deleteInterview = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    // Make sure user owns the interview
    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this interview'
      });
    }

    // Delete any responses associated with this interview
    await InterviewResponse.deleteMany({ interview: req.params.id });

    // Delete the interview
    await Interview.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Error deleting interview:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Generate interview questions using Gemini
// @route   POST /api/interviews/generate
// @access  Private
exports.generateQuestions = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    const { role, experience, techStack, difficulty } = req.body;

    // Validate input
    if (!role || !experience || !difficulty) {
      return res.status(400).json({
        success: false,
        message: 'Please provide role, experience, and difficulty'
      });
    }

    // Generate questions using Gemini
    const questions = await geminiService.generateInterviewQuestions({
      role,
      experience,
      techStack: Array.isArray(techStack) ? techStack : [],
      difficulty
    });

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (err) {
    console.error('Error generating questions:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};