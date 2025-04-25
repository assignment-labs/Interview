import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Clock, 
  Award,
  ThumbsUp,
  ChevronRight,
  PlusCircle,
  Loader2,
  BarChart2
} from 'lucide-react';
import api from '../../utils/apiUtils';

const InterviewDashboard = ({ isDark = false }) => {
  const [interviews, setInterviews] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch both interviews and stats
        const [interviewsRes, statsRes] = await Promise.all([
          api.get('/interviews'),
          api.get('/stats/dashboard')
        ]);
        
        setInterviews(interviewsRes.data.data);
        setStatsData(statsRes.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className={`w-12 h-12 animate-spin ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto px-4 py-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Interview Practice</h1>
          <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
            Practice interviews to improve your skills and confidence
          </p>
        </div>
        <button 
          onClick={() => navigate('/interviews/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          New Practice Interview
        </button>
      </div>

      {error && (
        <div className={`p-4 mb-6 rounded-lg ${isDark ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'}`}>
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-6 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
              <Briefcase className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="ml-3 text-lg font-medium">Total Interviews</h3>
          </div>
          <p className="text-3xl font-bold">{statsData?.totalInterviews || 0}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-green-900/30' : 'bg-green-100'}`}>
              <Award className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="ml-3 text-lg font-medium">Completed</h3>
          </div>
          <p className="text-3xl font-bold">{statsData?.completedInterviews || 0}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="ml-3 text-lg font-medium">Practice Time</h3>
          </div>
          <p className="text-3xl font-bold">{statsData?.totalHours || 0}<span className="text-lg ml-1">hrs</span></p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-full ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
              <ThumbsUp className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="ml-3 text-lg font-medium">Avg. Score</h3>
          </div>
          <p className="text-3xl font-bold">{statsData?.averageScore || 0}</p>
        </motion.div>
      </div>

      {/* Recent Interviews */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Recent Interviews</h2>
        <Link 
          to="/interviews/history" 
          className={`text-sm font-medium flex items-center ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
        >
          View all
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className={`p-12 rounded-lg border-2 border-dashed flex flex-col items-center justify-center ${
          isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
        }`}>
          <p className={`mb-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            You haven't created any interview practice sessions yet
          </p>
          <button
            onClick={() => navigate('/interviews/create')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Start Your First Interview
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {interviews.slice(0, 6).map((interview) => (
            <motion.div
              key={interview._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-lg shadow-md ${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} 
                transition-colors cursor-pointer`}
              onClick={() => navigate(`/interviews/${interview._id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-lg">{interview.role}</h3>
                {interview.completed ? (
                  <span className={`px-2 py-1 text-xs rounded-full 
                    ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'}`}>
                    Completed
                  </span>
                ) : (
                  <span className={`px-2 py-1 text-xs rounded-full 
                    ${isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                    In Progress
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'
                }`}>
                  {interview.experience}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                  isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
                }`}>
                  {interview.difficulty}
                </span>
                {interview.questions && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {interview.questions.length} questions
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(interview.createdAt).toLocaleDateString()}
                </p>
                <button 
                  className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/interviews/${interview._id}`);
                  }}
                >
                  {interview.completed ? 'View Results' : 'Continue'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Performance Link */}
      {statsData && statsData.completedInterviews > 0 && (
        <div className={`mt-8 p-6 rounded-lg shadow-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart2 className={`h-5 w-5 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className="text-xl font-semibold">Performance Analysis</h2>
            </div>
            <Link
              to="/interviews/performance"
              className={`px-4 py-2 rounded-lg ${
                isDark 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white text-sm font-medium`}
            >
              View Performance
            </Link>
          </div>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Track your progress and identify areas for improvement with detailed analytics
          </p>
        </div>
      )}
    </div>
  );
};

export default InterviewDashboard;