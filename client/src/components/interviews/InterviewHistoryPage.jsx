// src/components/interviews/InterviewHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/apiUtils';

const InterviewHistoryPage = () => {
  const [interviews, setInterviews] = useState([]);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'role', 'score'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  useEffect(() => {
    const fetchInterviewsAndResponses = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all interviews
        const interviewsRes = await api.get('/interviews');
        
        // Fetch all responses
        const responsesRes = await api.get('/interviews/responses');
        
        setInterviews(interviewsRes.data.data);
        setResponses(responsesRes.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching interview history:', err);
        setError('Failed to load interview history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterviewsAndResponses();
  }, []);

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
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

  // Create a map of interview IDs to responses for easier access
  const responseMap = responses.reduce((acc, response) => {
    acc[response.interview] = response;
    return acc;
  }, {});

  // Filter interviews based on selected filter
  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'all') return true;
    if (filter === 'completed') return interview.completed;
    if (filter === 'pending') return !interview.completed;
    return true;
  });

  // Sort interviews based on selected sorting option
  const sortedInterviews = [...filteredInterviews].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    }
    
    if (sortBy === 'role') {
      return sortOrder === 'asc'
        ? a.role.localeCompare(b.role)
        : b.role.localeCompare(a.role);
    }
    
    if (sortBy === 'score') {
      const scoreA = responseMap[a._id]?.overallScore || 0;
      const scoreB = responseMap[b._id]?.overallScore || 0;
      return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
    }
    
    return 0;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Interview History</h1>
            <p className="text-gray-600">View and manage all your interview practice sessions</p>
          </div>
          <Link 
            to="/interviews" 
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Filters and sorting */}
            <div className="flex flex-col md:flex-row justify-between mb-6">
              <div className="flex space-x-2 mb-4 md:mb-0">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'all'
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'completed'
                      ? 'bg-green-100 text-green-700 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    filter === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 font-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="mr-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="role">Role</option>
                  <option value="score">Score</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  {sortOrder === 'asc' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            {/* Results count */}
            <p className="text-sm text-gray-600 mb-4">
              Showing {sortedInterviews.length} of {interviews.length} interviews
            </p>
            
            {/* Interviews table */}
            {sortedInterviews.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">No interviews found with the selected filters.</p>
                <button
                  onClick={() => setFilter('all')}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View all interviews
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedInterviews.map((interview) => {
                      const response = responseMap[interview._id];
                      
                      return (
                        <tr key={interview._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{interview.role}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {interview.experience}
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full capitalize">
                                {interview.difficulty}
                              </span>
                              {interview.questions && (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                                  {interview.questions.length} questions
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(interview.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(interview.createdAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {interview.completed ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Completed
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {response ? (
                              <div className="flex items-center">
                                <span 
                                  className={`font-medium ${
                                    response.overallScore >= 7 
                                      ? 'text-green-600' 
                                      : response.overallScore >= 4 
                                        ? 'text-yellow-600' 
                                        : 'text-red-600'
                                  }`}
                                >
                                  {response.overallScore}
                                </span>
                                <span className="text-gray-400 text-xs ml-1">/10</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link 
                                to={`/interviews/${interview._id}`}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                {interview.completed ? 'Results' : 'Start'}
                              </Link>
                              <button
                                onClick={() => handleDeleteInterview(interview._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewHistoryPage;