// src/components/interviews/PerformancePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/apiUtils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const PerformancePage = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/stats/performance');
        setPerformanceData(res.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('Failed to load performance data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

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

  if (!performanceData || performanceData.performanceTrend.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Interview Performance</h1>
            <Link 
              to="/interviews" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              You haven't completed any interviews yet. Complete an interview to see your performance stats.
            </p>
            <Link 
              to="/interviews" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Start an interview
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const trendData = performanceData.performanceTrend.map(item => ({
    ...item,
    date: formatDate(item.date),
    formattedDate: new Date(item.date).toLocaleDateString()
  }));

  const questionTypeData = Object.entries(performanceData.questionTypePerformance).map(([type, score]) => ({
    type,
    score
  }));

  const difficultyData = Object.entries(performanceData.difficultyComparison).map(([difficulty, score]) => ({
    difficulty,
    score
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Interview Performance</h1>
            <p className="text-gray-600">Track your progress and identify areas for improvement</p>
          </div>
          <Link 
            to="/interviews" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {/* Performance Trend Chart */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance Over Time</h2>
          <div className="bg-gray-50 p-4 rounded-lg" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip 
                  formatter={(value) => [`${value}`, 'Score']}
                  labelFormatter={(label) => trendData.find(item => item.date === label)?.formattedDate || label}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3B82F6"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Your performance trend across {trendData.length} completed interviews
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Question Type Performance */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance by Question Type</h2>
            <div className="bg-gray-50 p-4 rounded-lg" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={questionTypeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Your average scores across different question types
            </p>
          </div>
          
          {/* Difficulty Comparison */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Performance by Difficulty</h2>
            <div className="bg-gray-50 p-4 rounded-lg" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={difficultyData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="difficulty" />
                  <PolarRadiusAxis domain={[0, 10]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              How you perform across different difficulty levels
            </p>
          </div>
        </div>
      </div>
      
      {/* Strengths and Areas for Improvement */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Insights</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Top Strengths</h3>
            <ul className="space-y-2">
              {performanceData.topStrengths && performanceData.topStrengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-600">{strength}</span>
                </li>
              ))}
              {(!performanceData.topStrengths || performanceData.topStrengths.length === 0) && (
                <li className="text-gray-500 italic">No data available yet</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Areas for Improvement</h3>
            <ul className="space-y-2">
              {performanceData.topImprovements && performanceData.topImprovements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span className="text-gray-600">{improvement}</span>
                </li>
              ))}
              {(!performanceData.topImprovements || performanceData.topImprovements.length === 0) && (
                <li className="text-gray-500 italic">No data available yet</li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Recommendations</h3>
          <p className="text-sm text-blue-700 mb-4">
            Based on your performance, here are some personalized recommendations:
          </p>
          <ul className="space-y-2 text-sm text-blue-700">
            {questionTypeData.length > 0 && questionTypeData.sort((a, b) => a.score - b.score)[0].score < 6 && (
              <li className="flex items-start">
                <span className="mr-2">→</span>
                <span>
                  Focus on practicing <strong>{questionTypeData.sort((a, b) => a.score - b.score)[0].type}</strong> questions, as this is your lowest-scoring area.
                </span>
              </li>
            )}
            {difficultyData.some(item => item.difficulty === 'hard' && item.score < 5) && (
              <li className="flex items-start">
                <span className="mr-2">→</span>
                <span>
                  Consider practicing more <strong>medium difficulty</strong> interviews before tackling hard ones to build confidence.
                </span>
              </li>
            )}
            {trendData.length >= 2 && 
              trendData[trendData.length - 1].score < trendData[trendData.length - 2].score && (
              <li className="flex items-start">
                <span className="mr-2">→</span>
                <span>
                  Your score decreased in your most recent interview. Review your feedback to identify why.
                </span>
              </li>
            )}
            <li className="flex items-start">
              <span className="mr-2">→</span>
              <span>
                Continue regular practice to improve consistency across all question types.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">→</span>
              <span>
                Keep doing at least one practice interview per week to maintain your skills.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;