// src/components/interviews/InterviewDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/apiUtils';

const InterviewDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showSampleAnswer, setShowSampleAnswer] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/interviews/${id}`);
        setInterview(res.data.data);
        
        // Try to get existing response
        try {
          const responseRes = await api.get(`/interviews/${id}/responses`);
          setResponse(responseRes.data.data);
          
          // Pre-fill answers from existing response
          if (responseRes.data.data.answers) {
            setAnswers(responseRes.data.data.answers);
          }
        } catch (err) {
          // No existing response, which is fine
          console.log('No existing response found');
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching interview:', err);
        setError('Failed to load interview. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterview();
    
    // Start timer
    const intervalId = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    setTimer(intervalId);
    
    // Clean up timer on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [id]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: {
        answer: value,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleNext = () => {
    if (currentQuestion < interview.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      window.scrollTo(0, 0);
    }
  };

  const toggleSampleAnswer = (questionId) => {
    setShowSampleAnswer({
      ...showSampleAnswer,
      [questionId]: !showSampleAnswer[questionId]
    });
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit this interview? You won\'t be able to change your answers afterward.')) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await api.post(`/interviews/${id}/responses`, { answers });
      
      // Refetch interview and response
      const interviewRes = await api.get(`/interviews/${id}`);
      setInterview(interviewRes.data.data);
      
      const responseRes = await api.get(`/interviews/${id}/responses`);
      setResponse(responseRes.data.data);
      
      // Clear timer
      if (timer) {
        clearInterval(timer);
      }
      
      // Scroll to top
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error submitting interview:', err);
      alert('Failed to submit interview. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Interview not found</p>
        <Link to="/interviews" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Back to interviews
        </Link>
      </div>
    );
  }

  // If there's a response with feedback, show the results page
  if (response && response.feedback) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-white">Interview Results</h1>
              <Link 
                to="/interviews" 
                className="text-white bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md text-sm"
              >
                Back to Interviews
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                {interview.role}
              </span>
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                {interview.experience}
              </span>
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full capitalize">
                {interview.difficulty} difficulty
              </span>
            </div>
          </div>
          
          {/* Score Overview */}
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h2 className="text-lg font-semibold text-gray-800">Overall Performance</h2>
                <p className="text-gray-600">Completed on {new Date(response.completedAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="3"
                      strokeDasharray="100, 100"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={`${response.overallScore >= 7 ? '#10B981' : response.overallScore >= 4 ? '#F59E0B' : '#EF4444'}`}
                      strokeWidth="3"
                      strokeDasharray={`${response.overallScore * 10}, 100`}
                    />
                    <text x="18" y="21" textAnchor="middle" fontSize="10" fill="#4B5563" fontWeight="bold">
                      {response.overallScore}/10
                    </text>
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="flex items-center mb-1">
                    <span 
                      className={`text-sm font-medium ${
                        response.overallScore >= 7 
                          ? 'text-green-600' 
                          : response.overallScore >= 4 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                      }`}
                    >
                      {response.overallScore >= 7 
                        ? 'Excellent' 
                        : response.overallScore >= 4 
                          ? 'Good' 
                          : 'Needs Improvement'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {interview.questions.length} questions answered
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Strengths & Areas for Improvement */}
          <div className="p-6 grid md:grid-cols-2 gap-6 border-b">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Strengths</h3>
              <ul className="space-y-2">
                {response.strengths && response.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Areas for Improvement</h3>
              <ul className="space-y-2">
                {response.improvements && response.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span className="text-gray-600">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Detailed Feedback */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Question Breakdown</h3>
            <div className="space-y-6">
              {interview.questions.map((question, index) => {
                const feedbackItem = response.feedback[question.id];
                
                if (!feedbackItem) return null;
                
                return (
                  <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-4 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-medium bg-gray-200 text-gray-800 px-2 py-1 rounded-full mr-2">
                          Q{index + 1}
                        </span>
                        <span className="text-xs font-medium capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {question.type}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            feedbackItem.rating >= 7 
                              ? 'bg-green-500' 
                              : feedbackItem.rating >= 4 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}
                        >
                          {feedbackItem.rating}
                        </div>
                        <span className="text-xs text-gray-500 ml-2">/ 10</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium text-gray-800 mb-2">{question.question}</h4>
                      
                      {/* User's Answer */}
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Your Answer:</h5>
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 whitespace-pre-wrap">
                          {answers[question.id]?.answer || <span className="text-gray-400 italic">No answer provided</span>}
                        </div>
                      </div>
                      
                      {/* Feedback */}
                      <div className="mb-2">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Feedback:</h5>
                        <div className="text-sm text-gray-600">
                          {feedbackItem.feedback}
                        </div>
                      </div>
                      
                      {/* Sample Answer */}
                      {question.sampleAnswer && (
                        <div>
                          <button
                            onClick={() => toggleSampleAnswer(question.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                          >
                            {showSampleAnswer[question.id] ? 'Hide' : 'Show'} sample answer
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-4 w-4 ml-1 transform ${showSampleAnswer[question.id] ? 'rotate-180' : ''}`} 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {showSampleAnswer[question.id] && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
                              {question.sampleAnswer}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the interview questions
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
            <h1 className="text-xl font-bold text-white mb-2 sm:mb-0">{interview.role} Interview</h1>
            <div className="flex items-center">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
                <span className="mr-1">⏱️</span>
                {formatTime(timeSpent)}
              </div>
              <Link 
                to="/interviews" 
                className="ml-3 text-white bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md text-sm"
              >
                Exit
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
              {interview.experience}
            </span>
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full capitalize">
              {interview.difficulty} difficulty
            </span>
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
              {currentQuestion + 1} of {interview.questions.length} questions
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-gray-200">
          <div 
            className="h-1 bg-blue-600"
            style={{ width: `${((currentQuestion + 1) / interview.questions.length) * 100}%` }}
          ></div>
        </div>
        
        {/* Question */}
        {interview.questions && interview.questions.length > 0 && (
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <span className="text-xs font-medium bg-gray-200 text-gray-800 px-2 py-1 rounded-full mr-2">
                  Question {currentQuestion + 1}
                </span>
                <span className="text-xs font-medium capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {interview.questions[currentQuestion].type}
                </span>
              </div>
              <h2 className="text-lg font-medium text-gray-800">
                {interview.questions[currentQuestion].question}
              </h2>
            </div>
            
            <div className="mb-6">
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                Your Answer
              </label>
              <textarea
                id="answer"
                rows="8"
                value={answers[interview.questions[currentQuestion].id]?.answer || ''}
                onChange={(e) => handleAnswerChange(interview.questions[currentQuestion].id, e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Type your answer here..."
              ></textarea>
            </div>
            
            {/* Sample Answer (hidden initially) */}
            {interview.questions[currentQuestion].sampleAnswer && (
              <div className="mb-6">
                <button
                  onClick={() => toggleSampleAnswer(interview.questions[currentQuestion].id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  {showSampleAnswer[interview.questions[currentQuestion].id] ? 'Hide' : 'Show'} sample answer
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 ml-1 transform ${showSampleAnswer[interview.questions[currentQuestion].id] ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showSampleAnswer[interview.questions[currentQuestion].id] && (
                  <div className="mt-2 p-4 bg-blue-50 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
                    {interview.questions[currentQuestion].sampleAnswer}
                  </div>
                )}
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  currentQuestion === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              
              {currentQuestion < interview.questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isSubmitting
                      ? 'bg-green-400 text-white cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Interview'
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewDetailPage;