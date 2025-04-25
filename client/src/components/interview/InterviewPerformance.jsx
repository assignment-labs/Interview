import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart2, 
  Activity, 
  Award, 
  Target, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../../utils/apiUtils';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const InterviewPerformance = ({ isDark = false }) => {
  const navigate = useNavigate();
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await api.get('/stats/performance');
      setPerformanceData(res.data.data);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to load performance data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Loading your performance data...
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

  if (!performanceData || !performanceData.performanceTrend || performanceData.performanceTrend.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/interviews')}
          className={`flex items-center mb-6 ${
            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Interviews
        </button>
        
        <div className={`p-6 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-center py-8">
            <BarChart2 className={`h-16 w-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            <h2 className="text-2xl font-bold mb-2">No Performance Data Yet</h2>
            <p className={`max-w-md mx-auto mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Complete at least one interview to see your performance analytics. This will help you track your progress and identify areas for improvement.
            </p>
            <Link 
              to="/interviews/create" 
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Start an Interview
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

  const questionTypeData = Object.entries(performanceData.questionTypePerformance || {}).map(([type, score]) => ({
    type,
    score
  }));

  const difficultyData = Object.entries(performanceData.difficultyComparison || {}).map(([difficulty, score]) => ({
    difficulty,
    score
  }));

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <button
            onClick={() => navigate('/interviews')}
            className={`flex items-center mb-2 ${
              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Interviews
          </button>
          <h1 className="text-2xl md:text-3xl font-bold">Interview Performance</h1>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Track your progress and identify areas for improvement
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Performance Trend Chart */}
        <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-500" />
            Performance Over Time
          </h2>
          <div className={`bg-${isDark ? 'gray-700' : 'gray-50'} p-4 rounded-lg`} style={{ height: '300px' }}>
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
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                />
                <YAxis 
                  domain={[0, 10]} 
                  stroke={isDark ? '#9ca3af' : '#6b7280'}
                />
                <Tooltip 
                  formatter={(value) => [`${value}`, 'Score']}
                  labelFormatter={(label) => trendData.find(item => item.date === label)?.formattedDate || label}
                  contentStyle={isDark ? { backgroundColor: '#374151', border: 'none', color: '#f9fafb' } : {}}
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
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Your performance trend across {trendData.length} completed interviews
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Question Type Performance */}
          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-500" />
              Performance by Question Type
            </h2>
            <div className={`bg-${isDark ? 'gray-700' : 'gray-50'} p-4 rounded-lg`} style={{ height: '300px' }}>
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
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="type" 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                  />
                  <YAxis 
                    domain={[0, 10]} 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                  />
                  <Tooltip 
                    contentStyle={isDark ? { backgroundColor: '#374151', border: 'none', color: '#f9fafb' } : {}}
                  />
                  <Legend />
                  <Bar dataKey="score" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Your average scores across different question types
            </p>
          </div>
          
          {/* Difficulty Comparison */}
          <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-green-500" />
              Performance by Difficulty
            </h2>
            <div className={`bg-${isDark ? 'gray-700' : 'gray-50'} p-4 rounded-lg`} style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={difficultyData}>
                  <PolarGrid stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <PolarAngleAxis dataKey="difficulty" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 10]} 
                    stroke={isDark ? '#9ca3af' : '#6b7280'}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.6}
                  />
                  <Tooltip contentStyle={isDark ? { backgroundColor: '#374151', border: 'none', color: '#f9fafb' } : {}} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              How you perform across different difficulty levels
            </p>
          </div>
        </div>
        
        {/* Strengths and Improvements */}
        <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-6">Your Insights</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className={`font-medium text-lg mb-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Top Strengths</h3>
              <ul className="space-y-2">
                {performanceData.topStrengths && performanceData.topStrengths.length > 0 ? (
                  performanceData.topStrengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className={`mr-2 ${isDark ? 'text-green-400' : 'text-green-500'}`}>✓</span>
                      <span>{strength}</span>
                    </li>
                  ))
                ) : (
                  <li className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No strengths data available yet
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h3 className={`font-medium text-lg mb-3 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>Areas for Improvement</h3>
              <ul className="space-y-2">
                {performanceData.topImprovements && performanceData.topImprovements.length > 0 ? (
                  performanceData.topImprovements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <span className={`mr-2 ${isDark ? 'text-red-400' : 'text-red-500'}`}>•</span>
                      <span>{improvement}</span>
                    </li>
                  ))
                ) : (
                  <li className={`italic ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No improvement recommendations available yet
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className={`p-6 rounded-lg shadow-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Personalized Recommendations</h2>
          <ul className="space-y-3">
            {questionTypeData.length > 0 && questionTypeData.sort((a, b) => a.score - b.score)[0].score < 6 && (
              <li className={`flex items-start ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <span className="mr-2">→</span>
                <span>
                  Focus on practicing <strong>{questionTypeData.sort((a, b) => a.score - b.score)[0].type}</strong> questions, as this is your lowest-scoring area.
                </span>
              </li>
            )}
            {difficultyData.some(item => item.difficulty === 'hard' && item.score < 5) && (
              <li className={`flex items-start ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <span className="mr-2">→</span>
                <span>
                  Consider practicing more <strong>medium difficulty</strong> interviews before tackling hard ones to build confidence.
                </span>
              </li>
            )}
            {trendData.length >= 2 && 
              trendData[trendData.length - 1].score < trendData[trendData.length - 2].score && (
              <li className={`flex items-start ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                <span className="mr-2">→</span>
                <span>
                  Your score decreased in your most recent interview. Review your feedback to identify why.
                </span>
              </li>
            )}
            <li className={`flex items-start ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              <span className="mr-2">→</span>
              <span>
                Continue regular practice to improve consistency across all question types.
              </span>
            </li>
            <li className={`flex items-start ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
              <span className="mr-2">→</span>
              <span>
                Try to complete at least one practice interview per week to maintain your skills.
              </span>
            </li>
          </ul>
        </div>
        
        <div className="flex justify-center pt-4">
          <Link 
            to="/interviews/create" 
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Practice New Interview
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default InterviewPerformance;