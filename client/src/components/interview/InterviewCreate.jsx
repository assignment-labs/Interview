import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Briefcase, 
  Clock,
  Code, 
  Brain,
  Sparkles,
  Loader2,
  ChevronRight
} from 'lucide-react';
import api from '../../utils/apiUtils';

// Define motion components to avoid React version conflicts
const MotionButton = motion.button;
const MotionDiv = motion.div;

const roles = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'UI/UX Designer',
  'Product Manager',
  'QA Engineer',
  'Mobile Developer',
  'Software Engineer'
];

const experienceLevels = [
  { value: 'Entry-level (0-2 years)', label: 'Entry Level (0-2 years)' },
  { value: 'Mid-level (3-5 years)', label: 'Mid-Level (3-5 years)' },
  { value: 'Senior (6+ years)', label: 'Senior (6+ years)' }
];

const techStacks = [
  'JavaScript', 'Python', 'Java', 'C#', 'Ruby', 'PHP',
  'React', 'Angular', 'Vue', 'Node.js', 'Django', 'Flask',
  'Spring Boot', 'ASP.NET', 'Ruby on Rails', 'Laravel',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
  'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL',
  'Machine Learning', 'Data Science', 'TypeScript'
];

const difficultyLevels = [
  {
    value: 'easy',
    label: 'Easy',
    description: 'Fundamental concepts and basic questions'
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Moderate complexity with some challenging questions'
  },
  {
    value: 'hard',
    label: 'Hard',
    description: 'Advanced concepts and tough scenario-based questions'
  }
];

const InterviewCreate = ({ isDark = false }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    role: '',
    experience: '',
    techStack: [],
    difficulty: 'medium'
  });

  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
    setStep(2);
  };

  const handleExperienceSelect = (experience) => {
    setFormData(prev => ({ ...prev, experience }));
    setStep(3);
  };

  const handleTechStackToggle = (tech) => {
    setFormData(prev => {
      const techStack = [...prev.techStack];
      if (techStack.includes(tech)) {
        return { ...prev, techStack: techStack.filter(t => t !== tech) };
      } else {
        if (techStack.length >= 5) return prev; // Limit to 5 techs
        return { ...prev, techStack: [...techStack, tech] };
      }
    });
  };

  const handleDifficultySelect = (difficulty) => {
    setFormData(prev => ({ ...prev, difficulty }));
  };

  const handleCreateInterview = async () => {
    if (!formData.role || !formData.experience) {
      setError('Please select a role and experience level');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const res = await api.post('/interviews', formData);
      
      // Redirect to the new interview
      navigate(`/interviews/${res.data.data._id}`);
    } catch (err) {
      console.error('Error creating interview:', err);
      setError(err.response?.data?.message || 'Failed to create interview. Please try again.');
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  const getStepTitle = () => {
    switch(step) {
      case 1:
        return "What role are you interviewing for?";
      case 2:
        return "What's your experience level?";
      case 3:
        return "Interview Setup";
      default:
        return "Create Interview";
    }
  };

  return (
    <MotionDiv
      initial="initial"
      animate="animate"
      variants={pageVariants}
      className={`max-w-5xl mx-auto px-5 py-10 ${isDark ? 'text-white' : 'text-gray-800'}`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8 relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
          />
        </div>

        <MotionButton
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/interviews'))}
          className={`flex items-center mb-8 text-base font-medium px-4 py-2 rounded-lg transition-all duration-300 ${
            isDark 
              ? 'text-blue-400 hover:text-blue-300 hover:bg-gray-800' 
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {step > 1 ? 'Back' : 'Return to Interviews'}
        </MotionButton>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-5 mb-8 rounded-xl border-2 shadow-lg ${
              isDark ? 'bg-red-900/30 text-red-200 border-red-800' : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        <MotionDiv
          key={`step-${step}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <MotionDiv 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {getStepTitle()}
            </h1>
            {step === 3 && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Selected: <span className="font-medium">{formData.role}</span> • {formData.experience}
              </motion.p>
            )}
          </MotionDiv>

          {step === 1 && (
            <MotionDiv
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            >
              {roles.map((role) => (
                <MotionButton
                  key={role}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03, boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-6 rounded-xl flex items-center justify-between ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  } shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                      <Briefcase className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="ml-4 text-lg font-medium">{role}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </MotionButton>
              ))}
            </MotionDiv>
          )}

          {step === 2 && (
            <MotionDiv
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-5"
            >
              {experienceLevels.map((level) => (
                <MotionButton
                  key={level.value}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExperienceSelect(level.value)}
                  className={`w-full p-6 rounded-xl flex items-center justify-between ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  } shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                      <Clock className="w-6 h-6 text-purple-500" />
                    </div>
                    <span className="ml-4 text-lg font-medium">{level.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </MotionButton>
              ))}
            </MotionDiv>
          )}

          {step === 3 && (
            <MotionDiv
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-12"
            >
              <MotionDiv 
                variants={itemVariants} 
                whileHover={{ boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)" }}
                className={`p-8 rounded-xl shadow-xl ${
                  isDark 
                    ? 'bg-gray-850 border-2 border-blue-600/40' 
                    : 'bg-white border-2 border-blue-400'
                } transition-all duration-300`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl opacity-20 pointer-events-none" />
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <div className={`p-3 rounded-lg mr-3 ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'} shadow-md`}>
                    <Code className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Technologies & Skills</span> 
                  <span className="text-sm font-normal ml-2 opacity-70">(Optional)</span>
                </h2>
                <p className={`mb-6 text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Select up to 5 technologies you want to focus on in this interview
                </p>
                <div className="flex flex-wrap gap-3">
                  {techStacks.map((tech) => (
                    <motion.button
                      key={tech}
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTechStackToggle(tech)}
                      disabled={
                        !formData.techStack.includes(tech) &&
                        formData.techStack.length >= 5
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium shadow-md transition-all duration-300 ${
                        formData.techStack.includes(tech)
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white ring-2 ring-blue-300'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${
                        !formData.techStack.includes(tech) &&
                        formData.techStack.length >= 5
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {tech}
                    </motion.button>
                  ))}
                </div>
                {formData.techStack.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-4 rounded-lg ${
                      isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'
                    } shadow-inner`}
                  >
                    <p className={`text-base ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                      <span className="font-medium">Selected:</span> {formData.techStack.join(', ')}
                    </p>
                  </motion.div>
                )}
              </MotionDiv>

              <MotionDiv 
                variants={itemVariants} 
                whileHover={{ boxShadow: "0 25px 50px -12px rgba(124, 58, 237, 0.25)" }}
                className={`p-8 rounded-xl shadow-xl relative overflow-hidden ${
                  isDark 
                    ? 'bg-gray-850 border-2 border-purple-600/40' 
                    : 'bg-white border-2 border-purple-400'
                } transition-all duration-300`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-xl opacity-20 pointer-events-none" />
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <div className={`p-3 rounded-lg mr-3 ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'} shadow-md`}>
                    <Brain className="w-6 h-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Interview Difficulty</span>
                </h2>
                <div className="space-y-4">
                  {difficultyLevels.map((level) => (
                    <motion.div
                      key={level.value}
                      whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-5 rounded-xl border-2 shadow-lg transition-all duration-300 ${
                        formData.difficulty === level.value
                          ? isDark
                            ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-300/30'
                            : 'border-purple-300 bg-purple-50 ring-2 ring-purple-200'
                          : isDark
                            ? 'border-gray-700 bg-gray-800/50'
                            : 'border-gray-100 bg-white'
                      } cursor-pointer`}
                      onClick={() => handleDifficultySelect(level.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full mr-4 flex items-center justify-center shadow-md ${
                              formData.difficulty === level.value
                                ? isDark 
                                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 border-2 border-purple-300/50' 
                                  : 'bg-gradient-to-r from-purple-500 to-indigo-600 border-2 border-purple-200'
                                : isDark
                                  ? 'bg-gray-700 border-2 border-gray-600'
                                  : 'bg-gray-200 border-2 border-gray-300'
                            }`}
                          >
                            {formData.difficulty === level.value && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            )}
                          </div>
                          <span className="font-bold text-lg capitalize">{level.label}</span>
                        </div>
                      </div>
                      <p
                        className={`mt-3 text-base pl-9 ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        {level.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </MotionDiv>

              <MotionDiv variants={itemVariants} className="pt-4">
                <MotionButton
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateInterview}
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-lg font-medium 
                    focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 shadow-lg
                    ${isDark ? 'focus:ring-offset-gray-900' : ''} 
                    transition-all duration-300
                    ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-6 h-6 mr-3" />
                      </motion.div>
                      Creating Interview...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Sparkles className="w-6 h-6 mr-3" />
                      Generate Interview Questions
                    </div>
                  )}
                </MotionButton>
              </MotionDiv>
            </MotionDiv>
          )}
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};

export default InterviewCreate;