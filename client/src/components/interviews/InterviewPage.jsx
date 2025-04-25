// src/components/interviews/InterviewPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import InterviewList from './InterviewList';
import CreateInterviewForm from './CreateInterviewForm';
import StatsSummary from './StatsSummary';
import api from '../../utils/apiUtils';

const InterviewPage = () => {
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const res = await api.get('/stats/dashboard');
        setStatsData(res.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load interview stats. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="bg-white shadow-md rounded-lg p-8 mb-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Interview Practice</h2>
        <p className="text-gray-600 mb-6">
          Sign in to create and practice mock interviews for your next job opportunity.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium">
            Sign In
          </Link>
          <Link to="/register" className="border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 px-6 rounded-md font-medium">
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="lg:w-2/3">
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Interview Practice</h1>
            <p className="text-gray-600 mb-6">
              Practice technical interviews with AI-generated questions tailored to your experience level and desired role.
            </p>
            
            <CreateInterviewForm />
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Interviews</h2>
              <Link to="/interviews/history" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View all →
              </Link>
            </div>
            
            <InterviewList />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:w-1/3">
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Stats</h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-4">{error}</p>
            ) : (
              <StatsSummary stats={statsData} />
            )}
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Interview Tips</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600">Research the company beforehand</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600">Practice explaining complex concepts clearly</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600">Prepare specific examples from your experience</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600">Follow the STAR method for behavioral questions</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600">Ask thoughtful questions at the end</span>
              </li>
            </ul>
            
            <Link to="/resources/interview-preparation" className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium">
              View more interview resources →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;