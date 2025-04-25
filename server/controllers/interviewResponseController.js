// controllers/interviewResponseController.js
const Interview = require('../models/Interview');
const InterviewResponse = require('../models/InterviewResponse');

// @desc    Create or update interview response
// @route   POST /api/interviews/:id/responses
// @access  Private
exports.createResponse = async (req, res) => {
  try {
    const { answers } = req.body;
    const interviewId = req.params.id;

    // Validate that the interview exists and belongs to the user
    const interview = await Interview.findById(interviewId);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }

    if (interview.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }

    // Check if a response already exists
    let response = await InterviewResponse.findOne({
      interview: interviewId,
      user: req.user.id
    });

    // If no existing response, create a new one
    if (!response) {
      response = new InterviewResponse({
        interview: interviewId,
        user: req.user.id,
        answers,
        completedAt: new Date()
      });
    } else {
      // Update existing response
      response.answers = answers;
      response.completedAt = new Date();
    }

    // Generate feedback based on the answers (this is a simplified version)
    const feedback = generateFeedback(answers, interview.questions);
    response.feedback = feedback.questionFeedback;
    response.overallScore = feedback.overallScore;
    response.strengths = feedback.strengths;
    response.improvements = feedback.improvements;

    // Save the response
    await response.save();

    // Mark the interview as completed
    interview.completed = true;
    await interview.save();

    res.status(201).json({
      success: true,
      data: response
    });
  } catch (err) {
    console.error('Error creating interview response:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get interview response
// @route   GET /api/interviews/:id/responses
// @access  Private
exports.getResponse = async (req, res) => {
  try {
    const interviewId = req.params.id;

    // Find the response for this interview
    const response = await InterviewResponse.findOne({
      interview: interviewId,
      user: req.user.id
    });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'No response found for this interview'
      });
    }

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (err) {
    console.error('Error fetching interview response:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get all responses for a user
// @route   GET /api/interviews/responses
// @access  Private
exports.getAllResponses = async (req, res) => {
  try {
    const responses = await InterviewResponse.find({
      user: req.user.id
    }).populate({
      path: 'interview',
      select: 'role difficulty createdAt'
    }).sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      count: responses.length,
      data: responses
    });
  } catch (err) {
    console.error('Error fetching interview responses:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// Helper function to generate feedback based on answers
function generateFeedback(answers, questions) {
  const questionFeedback = {};
  let totalScore = 0;
  let count = 0;
  
  // Process each answer
  Object.entries(answers).forEach(([questionId, answerObj]) => {
    const answer = answerObj.answer || '';
    
    // Find the corresponding question
    const questionInfo = questions.find(q => q.id === questionId);
    if (!questionInfo) return;
    
    // Generate rating based on answer length and quality (simplified algorithm)
    let rating = 0;
    if (answer) {
      // Simple algorithm: longer answers get better ratings
      const length = answer.length;
      const baseRating = length > 200 ? 8 : length > 100 ? 7 : length > 50 ? 6 : 5;
      // Add some randomness
      rating = Math.min(10, Math.max(1, baseRating + Math.floor(Math.random() * 3) - 1));
    } else {
      rating = 0;
    }
    
    // Generate appropriate feedback text
    let feedbackText = '';
    if (rating >= 8) {
      feedbackText = "Excellent answer! You demonstrated strong understanding of the topic and provided clear examples.";
    } else if (rating >= 6) {
      feedbackText = "Good answer. You covered the main points well, though there's room to provide more detail and specific examples.";
    } else if (rating > 0) {
      feedbackText = "Your answer addressed the question, but could benefit from more depth, structure, and specific examples from your experience.";
    } else {
      feedbackText = "No answer provided.";
    }
    
    questionFeedback[questionId] = {
      rating,
      feedback: feedbackText
    };
    
    if (rating > 0) {
      totalScore += rating;
      count++;
    }
  });
  
  // Calculate overall score
  const overallScore = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;
  
  // Analyze strengths and areas for improvement
  const strengths = [];
  const improvements = [];
  
  // Check for high and low ratings
  const highRatings = Object.values(questionFeedback).filter(f => f.rating >= 8).length;
  const lowRatings = Object.values(questionFeedback).filter(f => f.rating <= 4 && f.rating > 0).length;
  const longAnswers = Object.values(answers).filter(a => a.answer && a.answer.length > 200).length;
  const shortAnswers = Object.values(answers).filter(a => a.answer && a.answer.length < 50).length;
  
  // Generate strengths
  if (highRatings > 0) {
    strengths.push("Strong performance in key technical areas");
  }
  if (longAnswers > Object.values(answers).length / 3) {
    strengths.push("Thorough and detailed responses");
  }
  if (lowRatings === 0 && count > 0) {
    strengths.push("Consistent performance across all questions");
  }
  
  // Add default strengths if needed
  if (strengths.length < 2 && count > 0) {
    strengths.push("Communication skills");
    strengths.push("Technical knowledge base");
  }
  
  // Generate improvements
  if (lowRatings > 0) {
    improvements.push("Focus on strengthening technical fundamentals");
  }
  if (shortAnswers > Object.values(answers).length / 3) {
    improvements.push("Provide more comprehensive answers with examples");
  }
  if (highRatings < Object.values(questionFeedback).length / 3 && count > 0) {
    improvements.push("Deepen knowledge in key technical areas");
  }
  
  // Add default improvements if needed
  if (improvements.length < 2 && count > 0) {
    improvements.push("Structured problem-solving approach");
    improvements.push("Confidence in technical communication");
  }
  
  return {
    questionFeedback,
    overallScore,
    strengths,
    improvements
  };
}