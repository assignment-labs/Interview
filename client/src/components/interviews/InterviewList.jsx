// src/components/interviews/InterviewList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/apiUtils';

const InterviewList = () => {
  const [interviews, setInterviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/interviews');
        setInterviews(res.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching interviews:', err);
        setError('Failed to load interviews. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) {
      return;
    }
    
    try {
      await api.delete(`/interviews/${id}`);
      setInterviews(interviews.filter(interview => interview._id !== id));
    } catch (err) {
      console.error('Error deleting interview:', err);
      alert('Failed to delete interview. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 mb-4">You haven't created any interview practice sessions yet.</p>
        <p className="text-sm text-gray-400">Create your first interview above to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interviews.slice(0, 5).map((interview) => (
        <div 
          key={interview._id} 
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{interview.role}</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {interview.experience}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded capitalize">
                  {interview.difficulty}
                </span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {interview.completed ? 'Completed' : 'Not started'}
                </span>
              </div>
              {interview.techStack && interview.techStack.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">Tech Stack:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {interview.techStack.slice(0, 3).map((tech, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                    {interview.techStack.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        +{interview.techStack.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Created {new Date(interview.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Link 
                to={`/interviews/${interview._id}`} 
                className="text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <button 
                onClick={() => handleDeleteInterview(interview._id)}
                className="text-red-600 hover:text-red-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="mt-3 flex justify-between">
            <div className="flex space-x-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-500">
                {interview.questions ? `${interview.questions.length} questions` : 'Loading questions...'}
              </span>
            </div>
            
            <Link 
              to={`/interviews/${interview._id}`}
              className={`text-sm font-medium ${
                interview.completed 
                  ? 'text-green-600 hover:text-green-800' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {interview.completed ? 'View Results' : 'Start Interview'}
            </Link>
          </div>
        </div>
      ))}

      {interviews.length > 5 && (
        <div className="text-center pt-4">
          <Link 
            to="/interviews/history" 
            className="inline-block text-blue-600 hover:text-blue-800 font-medium"
          >
            View all interviews ({interviews.length})
          </Link>
        </div>
      )}
    </div>
  );
};

export default InterviewList;