// controllers/interviewStatsController.js
const Interview = require('../models/Interview');
const InterviewResponse = require('../models/InterviewResponse');

// @desc    Get user dashboard stats
// @route   GET /api/stats/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    // Get all interviews for the user
    const interviews = await Interview.find({ user: req.user.id });
    
    // Get all interview responses for the user
    const responses = await InterviewResponse.find({ user: req.user.id });
    
    // Calculate total practice time (estimated based on interview complexity)
    const totalMinutes = interviews.reduce((sum, interview) => {
      // Estimate based on difficulty and number of questions
      const questionCount = interview.questions ? interview.questions.length : 0;
      const difficultyFactor = interview.difficulty === 'hard' ? 5 : 
                              interview.difficulty === 'medium' ? 3 : 2;
      return sum + (questionCount * difficultyFactor);
    }, 0);
    
    // Convert to hours with 1 decimal place
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    
    // Calculate completed interviews count
    const completedInterviews = interviews.filter(interview => interview.completed).length;
    
    // Calculate average score from responses
    let totalScore = 0;
    let scoreCount = 0;
    
    responses.forEach(response => {
      if (response.overallScore) {
        totalScore += response.overallScore;
        scoreCount++;
      }
    });
    
    const averageScore = scoreCount > 0 
      ? Math.round((totalScore / scoreCount) * 10) / 10 
      : 0;
    
    // Get recent interviews (last 5)
    const recentInterviews = await Interview.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('role difficulty createdAt completed');
    
    // Get role distribution stats
    const roleCounts = {};
    interviews.forEach(interview => {
      const role = interview.role || 'Other';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    // Get difficulty distribution stats
    const difficultyCounts = {
      easy: 0,
      medium: 0,
      hard: 0
    };
    
    interviews.forEach(interview => {
      if (interview.difficulty in difficultyCounts) {
        difficultyCounts[interview.difficulty]++;
      }
    });
    
    // Generate recent activity feed
    const recentActivity = [];
    
    // Add interview creation activities
    interviews.slice(0, 5).forEach(interview => {
      recentActivity.push({
        type: 'interview_created',
        date: interview.createdAt,
        data: {
          id: interview._id,
          role: interview.role || 'Not specified',
          difficulty: interview.difficulty || 'medium'
        }
      });
    });
    
    // Add interview completion activities
    responses.slice(0, 5).forEach(response => {
      recentActivity.push({
        type: 'interview_completed',
        date: response.completedAt,
        data: {
          id: response.interview,
          score: response.overallScore || 0
        }
      });
    });
    
    // Sort by date (most recent first) and limit to 5
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    const limitedActivity = recentActivity.slice(0, 5);
    
    // Return the dashboard stats
    res.status(200).json({
      success: true,
      data: {
        totalInterviews: interviews.length,
        completedInterviews,
        totalHours,
        averageScore,
        recentInterviews,
        roleCounts,
        difficultyCounts,
        recentActivity: limitedActivity
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

// @desc    Get performance trends over time
// @route   GET /api/stats/performance
// @access  Private
exports.getPerformanceTrends = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }
    
    // Get all interview responses for the user, sorted by completion date
    const responses = await InterviewResponse.find({ user: req.user.id })
      .sort({ completedAt: 1 })
      .populate({
        path: 'interview',
        select: 'role difficulty questions'
      });
    
    if (responses.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          performanceTrend: [],
          questionTypePerformance: {},
          difficultyComparison: {
            easy: 0,
            medium: 0,
            hard: 0
          }
        }
      });
    }
    
    // Map to score over time data
    const performanceTrend = responses.map(response => ({
      date: response.completedAt,
      score: response.overallScore || 0,
      role: response.interview ? response.interview.role : 'Unknown',
      difficulty: response.interview ? response.interview.difficulty : 'medium'
    }));
    
    // Calculate performance by question type
    const questionTypePerformance = {};
    
    responses.forEach(response => {
      if (!response.interview || !response.interview.questions) return;
      
      const questionMap = response.interview.questions.reduce((acc, q) => {
        acc[q.id] = q.type;
        return acc;
      }, {});
      
      Object.entries(response.feedback || {}).forEach(([questionId, feedback]) => {
        const questionType = questionMap[questionId];
        if (!questionType) return;
        
        if (!questionTypePerformance[questionType]) {
          questionTypePerformance[questionType] = {
            totalScore: 0,
            count: 0
          };
        }
        
        questionTypePerformance[questionType].totalScore += (feedback.rating || 0);
        questionTypePerformance[questionType].count += 1;
      });
    });
    
    // Calculate average scores by question type
    Object.keys(questionTypePerformance).forEach(type => {
      const { totalScore, count } = questionTypePerformance[type];
      questionTypePerformance[type] = count > 0 
        ? Math.round((totalScore / count) * 10) / 10 
        : 0;
    });
    
    // Calculate performance by difficulty level
    const difficultyScores = {
      easy: { total: 0, count: 0 },
      medium: { total: 0, count: 0 },
      hard: { total: 0, count: 0 }
    };
    
    responses.forEach(response => {
      if (!response.interview) return;
      
      const difficulty = response.interview.difficulty || 'medium';
      if (difficulty in difficultyScores) {
        difficultyScores[difficulty].total += (response.overallScore || 0);
        difficultyScores[difficulty].count += 1;
      }
    });
    
    // Calculate average scores by difficulty
    const difficultyComparison = {};
    Object.keys(difficultyScores).forEach(difficulty => {
      const { total, count } = difficultyScores[difficulty];
      difficultyComparison[difficulty] = count > 0 
        ? Math.round((total / count) * 10) / 10 
        : 0;
    });
    
    // Calculate most common strengths and areas for improvement
    const strengthsCounts = {};
    const improvementsCounts = {};
    
    responses.forEach(response => {
      (response.strengths || []).forEach(strength => {
        strengthsCounts[strength] = (strengthsCounts[strength] || 0) + 1;
      });
      
      (response.improvements || []).forEach(improvement => {
        improvementsCounts[improvement] = (improvementsCounts[improvement] || 0) + 1;
      });
    });
    
    // Sort and get top 3 for each
    const topStrengths = Object.entries(strengthsCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([strength]) => strength);
      
    const topImprovements = Object.entries(improvementsCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([improvement]) => improvement);
    
    res.status(200).json({
      success: true,
      data: {
        performanceTrend,
        questionTypePerformance,
        difficultyComparison,
        topStrengths,
        topImprovements
      }
    });
  } catch (err) {
    console.error('Error fetching performance trends:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};