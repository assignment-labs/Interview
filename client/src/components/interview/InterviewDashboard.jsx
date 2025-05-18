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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className={`w-16 h-16 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 ${isDark ? 'text-white' : 'text-gray-800'}`}
    >
      {/* Header Section */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Interview Practice</h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Practice interviews to improve your skills and confidence
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/interviews/create')}
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 py-3 rounded-xl flex items-center shadow-lg transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          New Practice Interview
        </motion.button>
      </motion.div>

      {/* Error Alert */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 mb-8 rounded-xl border-2 ${
            isDark ? 'bg-red-900/30 text-red-200 border-red-800' : 'bg-red-50 text-red-700 border-red-200'
          } shadow-lg`}
        >
          <p className="font-medium">{error}</p>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12"
      >
        {/* Total Interviews */}
        <motion.div 
          variants={item}
          whileHover={{ y: -5, boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          className={`p-6 sm:p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-100'} shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
              <Briefcase className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="ml-4 text-base sm:text-lg font-medium">Total Interviews</h3>
          </div>
          <p className="text-3xl sm:text-4xl font-bold mt-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {statsData?.totalInterviews || 0}
            </motion.span>
          </p>
        </motion.div>

        {/* Completed */}
        <motion.div 
          variants={item}
          whileHover={{ y: -5, boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          className={`p-6 sm:p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-100'} shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-green-900/40' : 'bg-green-100'}`}>
              <Award className="h-6 w-6 text-green-500" />
            </div>
            <h3 className="ml-4 text-base sm:text-lg font-medium">Completed</h3>
          </div>
          <p className="text-3xl sm:text-4xl font-bold mt-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              {statsData?.completedInterviews || 0}
            </motion.span>
          </p>
        </motion.div>

        {/* Practice Time */}
        <motion.div 
          variants={item}
          whileHover={{ y: -5, boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          className={`p-6 sm:p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-100'} shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="ml-4 text-base sm:text-lg font-medium">Practice Time</h3>
          </div>
          <p className="text-3xl sm:text-4xl font-bold mt-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {statsData?.totalHours || 0}<span className="text-sm sm:text-xl ml-1">hrs</span>
            </motion.span>
          </p>
        </motion.div>

        {/* Avg. Score */}
        <motion.div 
          variants={item}
          whileHover={{ y: -5, boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          className={`p-6 sm:p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-100'} shadow-xl transition-all duration-300`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 sm:p-4 rounded-xl ${isDark ? 'bg-amber-900/40' : 'bg-amber-100'}`}>
              <ThumbsUp className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="ml-4 text-base sm:text-lg font-medium">Avg. Score</h3>
          </div>
          <p className="text-3xl sm:text-4xl font-bold mt-2">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              {statsData?.averageScore || 0}
            </motion.span>
          </p>
        </motion.div>
      </motion.div>

      {/* Recent Interviews Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8"
      >
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Recent Interviews</h2>
        <Link 
          to="/interviews/history" 
          className={`text-sm font-medium flex items-center mt-2 sm:mt-0 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} transition-colors group`}
        >
          View all
          <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* No Interviews State */}
      {interviews.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className={`p-10 sm:p-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center ${
            isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          } shadow-inner`}
        >
          <p className={`mb-6 text-center text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            You haven't created any interview practice sessions yet
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/interviews/create')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl flex items-center shadow-lg transition-all duration-300"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Start Your First Interview
          </motion.button>
        </motion.div>
      ) : (
        /* Interview Cards Grid */
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {interviews.slice(0, 6).map((interview, index) => (
            <motion.div
              key={interview._id}
              variants={item}
              whileHover={{ y: -5, boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
              className={`p-6 sm:p-8 rounded-2xl shadow-xl ${
                isDark ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700' : 'bg-white hover:bg-gray-50 border border-gray-100'
              } transition-all duration-300 cursor-pointer overflow-hidden relative`}
              onClick={() => navigate(`/interviews/${interview._id}`)}
            >
              {/* Status Indicator - Line at the top */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  interview.completed 
                    ? (isDark ? 'bg-green-500' : 'bg-green-500') 
                    : (isDark ? 'bg-yellow-500' : 'bg-yellow-500')
                }`}
              />
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg sm:text-xl truncate max-w-[70%]">{interview.role}</h3>
                {interview.completed ? (
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-full shadow-sm 
                    ${isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-800'}`}>
                    Completed
                  </span>
                ) : (
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-full shadow-sm 
                    ${isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                    In Progress
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-3 py-1.5 rounded-full shadow-sm ${
                  isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-800'
                }`}>
                  {interview.experience}
                </span>
                <span className={`text-xs px-3 py-1.5 rounded-full capitalize shadow-sm ${
                  isDark ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-800'
                }`}>
                  {interview.difficulty}
                </span>
                {interview.questions && (
                  <span className={`text-xs px-3 py-1.5 rounded-full shadow-sm ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {interview.questions.length} questions
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(interview.createdAt).toLocaleDateString()}
                </p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-all ${
                    isDark 
                      ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/interviews/${interview._id}`);
                  }}
                >
                  {interview.completed ? 'View Results' : 'Continue'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Performance Analysis Card */}
      {statsData && statsData.completedInterviews > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className={`mt-10 sm:mt-12 p-8 sm:p-10 rounded-2xl shadow-2xl ${
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
              : 'bg-gradient-to-br from-white to-gray-50 border border-gray-100'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center">
                <BarChart2 className={`h-6 w-6 mr-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Performance Analysis</h2>
              </div>
              <p className={`mt-3 ${isDark ? 'text-gray-300' : 'text-gray-600'} text-base`}>
                Track your progress and identify areas for improvement
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/interviews/performance"
                className={`px-6 py-3 rounded-xl shadow-lg ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'
                } text-white text-sm font-medium transition-all duration-300 flex items-center justify-center w-full sm:w-auto`}
              >
                View Performance
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default InterviewDashboard;