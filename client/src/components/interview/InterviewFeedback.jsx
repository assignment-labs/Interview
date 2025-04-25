import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Home, 
  Loader2, 
  ThumbsUp, 
  Target, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart2
} from 'lucide-react';
import api from '../../utils/apiUtils';

const InterviewFeedback = ({ isDark = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedbackData, setFeedbackData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [overallScore, setOverallScore] = useState(0);
  const [strengths, setStrengths] = useState([]);
  const [improvements, setImprovements] = useState([]);

  useEffect(() => {
    fetchFeedbackData();
  }, [id]);

  const fetchFeedbackData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the interview data
      const interviewRes = await api.get(`/interviews/${id}`);
      const interview = interviewRes.data.data;
      
      // Get the response data
      const responseRes = await api.get(`/interviews/${id}/responses`);
      const response = responseRes.data.data;
      
      // Calculate overall score
      const totalScore = Object.values(response.feedback || {}).reduce((sum, item) => sum + (item.rating || 0), 0);
      const avgScore = Object.values(response.feedback || {}).length > 0 
        ? Math.round((totalScore / Object.values(response.feedback || {}).length) * 10) / 10 
        : 0;
      
      setOverallScore(avgScore);
      setStrengths(response.strengths || []);
      setImprovements(response.improvements || []);
      
      // Create combined data object
      const combinedData = {
        interview,
        response
      };
      
      setFeedbackData(combinedData);
      
      // Initialize questions as collapsed
      const initialExpandedState = {};
      if (interview.questions) {
        interview.questions.forEach(q => {
          initialExpandedState[q.id] = false;
        });
      }
      setExpandedQuestions(initialExpandedState);
      
    } catch (err) {
      console.error('Error fetching feedback data:', err);
      setError('Failed to load feedback data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const downloadFeedback = () => {
    if (!feedbackData) return;
    
    const { interview, response } = feedbackData;
    
    let feedbackText = `Interview Feedback Report\n`;
    feedbackText += `=========================\n\n`;
    feedbackText += `Role: ${interview.role || 'Not specified'}\n`;
    feedbackText += `Experience Level: ${interview.experience || 'Not specified'}\n`;
    feedbackText += `Difficulty: ${interview.difficulty || 'Not specified'}\n`;
    feedbackText += `Date: ${new Date(response.completedAt || Date.now()).toLocaleDateString()}\n`;
    feedbackText += `Overall Score: ${overallScore}/10\n\n`;
    
    feedbackText += `Strengths:\n`;
    strengths.forEach(s => {
      feedbackText += `- ${s}\n`;
    });
    
    feedbackText += `\nAreas to Improve:\n`;
    improvements.forEach(i => {
      feedbackText += `- ${i}\n`;
    });
    
    feedbackText += `\nQuestions and Answers:\n`;
    feedbackText += `======================\n\n`;
    
    interview.questions.forEach((question, index) => {
      const answer = response.answers?.[question.id]?.answer || 'No answer provided';
      const feedback = response.feedback?.[question.id]?.feedback || 'No feedback available';
      const rating = response.feedback?.[question.id]?.rating || 'N/A';
      
      feedbackText += `${index + 1}. ${question.question}\n`;
      feedbackText += `Type: ${question.type}\n`;
      feedbackText += `Your Answer: ${answer}\n`;
      feedbackText += `Rating: ${rating}/10\n`;
      feedbackText += `Feedback: ${feedback}\n\n`;
    });
    
    const blob = new Blob([feedbackText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-feedback-${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return isDark ? 'text-green-400' : 'text-green-500';
    if (score >= 6) return isDark ? 'text-yellow-400' : 'text-yellow-500';
    return isDark ? 'text-red-400' : 'text-red-500';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return isDark ? 'bg-green-400' : 'bg-green-500';
    if (score >= 6) return isDark ? 'bg-yellow-400' : 'bg-yellow-500';
    return isDark ? 'bg-red-400' : 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Loading your feedback...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => navigate('/interviews')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Interviews
        </button>
      </div>
    );
  }

  if (!feedbackData || !feedbackData.interview || !feedbackData.response) {
    return (
      <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Feedback Not Available</h2>
        <p className="mb-4">Sorry, we couldn't find feedback for this interview.</p>
        <button
          onClick={() => navigate('/interviews')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Interviews
        </button>
      </div>
    );
  }

  const { interview, response } = feedbackData;

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 md:py-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 md:space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Interview Feedback</h1>
          <div className="flex space-x-3">
            <button
              onClick={downloadFeedback}
              className={`p-2 rounded-md flex items-center ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="Download feedback report"
            >
              <Download className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={() => navigate('/interviews')}
              className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            >
              <Home className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-4 md:p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold">Overall Performance</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Role: {interview.role || 'Not specified'}
              </p>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Completed: {new Date(response.completedAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center">
              <div className={`text-4xl font-bold flex items-center ${getScoreColor(overallScore)}`}>
                {overallScore}/10
                {overallScore >= 8 ? (
                  <CheckCircle className="ml-2 h-6 w-6" />
                ) : null}
              </div>
            </div>
          </div>
          
          <div className={`h-2 w-full rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} my-4`}>
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${getScoreBgColor(overallScore)}`}
              style={{ width: `${overallScore * 10}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex items-center mb-2">
                <ThumbsUp className={`w-5 h-5 mr-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className="font-medium">Strengths</h3>
              </div>
              <ul className={`text-sm mt-2 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {strengths.length > 0 ? (
                  strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">No strengths identified</li>
                )}
              </ul>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex items-center mb-2">
                <Target className={`w-5 h-5 mr-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <h3 className="font-medium">Areas to Improve</h3>
              </div>
              <ul className={`text-sm mt-2 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {improvements.length > 0 ? (
                  improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">No improvements suggested</li>
                )}
              </ul>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="flex items-center mb-2">
                <TrendingUp className={`w-5 h-5 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className="font-medium">Next Steps</h3>
              </div>
              <ul className={`text-sm mt-2 space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Review detailed question feedback below</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Practice areas highlighted for improvement</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Try another mock interview to track progress</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
        
        <div>
          <div className="flex items-center mb-4">
            <BarChart2 className={`mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className="text-xl font-bold">Detailed Question Feedback</h2>
          </div>
          <div className="space-y-3 md:space-y-4">
            {interview.questions.map((question, index) => {
              const feedback = response.feedback ? response.feedback[question.id] : null;
              const answer = response.answers ? response.answers[question.id] : null;
              const rating = feedback ? feedback.rating : null;
              
              return (
                <motion.div 
                  key={question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={`p-4 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                >
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <div className="flex items-center">
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}>
                        Q{index + 1}
                      </span>
                      <span className="ml-3 font-medium truncate">{question.question}</span>
                    </div>
                    <div className="flex items-center ml-2">
                      <span className={`mr-3 font-medium ${getScoreColor(rating || 0)}`}>
                        {rating || '?'}/10
                      </span>
                      {expandedQuestions[question.id] ? (
                        <ChevronUp className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  
                  {expandedQuestions[question.id] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 pl-6 md:pl-9"
                    >
                      <div className="mb-4">
                        <h3 className={`text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Your Answer:
                        </h3>
                        <p className={`text-sm whitespace-pre-wrap ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {answer?.answer || "No answer recorded"}
                        </p>
                      </div>
                      
                      <div className="mb-2">
                        <h3 className={`text-sm font-medium mb-1 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Feedback:
                        </h3>
                        <p className={`text-sm whitespace-pre-wrap ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {feedback?.feedback || "No feedback available"}
                        </p>
                      </div>
                      
                      {question.sampleAnswer && (
                        <div className="mt-4">
                          <h3 className={`text-sm font-medium mb-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Sample Answer:
                          </h3>
                          <div className={`mt-2 p-3 rounded-lg text-sm ${
                            isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {question.sampleAnswer}
                          </div>
                        </div>
                      )}
                      
                      <div className={`mt-4 p-3 rounded-lg text-sm ${
                        isDark ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-700'
                      }`}>
                        <p>
                          <span className="font-medium">Tip:</span> {' '}
                          {rating >= 8 
                            ? "Great answer! Consider using this approach in future interviews."
                            : rating >= 6
                              ? "Good foundation. Adding more specific examples would strengthen this answer."
                              : "Focus on structuring your answer with an introduction, key points, and a conclusion."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigate('/interviews/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Start a New Interview
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewFeedback;