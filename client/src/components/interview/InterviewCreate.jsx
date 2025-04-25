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
  Loader2
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

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>
      <button
        onClick={() => (step > 1 ? setStep(step - 1) : navigate('/interviews'))}
        className={`flex items-center mb-6 ${
          isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'
        }`}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {step > 1 ? 'Back' : 'Return to Interviews'}
      </button>

      {error && (
        <div className={`p-4 mb-6 rounded-lg ${
          isDark ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-600'
        }`}>
          {error}
        </div>
      )}

      <MotionDiv
        key={`step-${step}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {step === 1 && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">
              What role are you interviewing for?
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {roles.map((role) => (
                <MotionButton
                  key={role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect(role)}
                  className={`p-4 rounded-lg flex items-center justify-between ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  } shadow-sm transition-colors`}
                >
                  <div className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-3 text-blue-500" />
                    <span>{role}</span>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </MotionButton>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">
              What's your experience level?
            </h1>
            <div className="space-y-4">
              {experienceLevels.map((level) => (
                <MotionButton
                  key={level.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExperienceSelect(level.value)}
                  className={`w-full p-4 rounded-lg flex items-center justify-between ${
                    isDark 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  } shadow-sm transition-colors`}
                >
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-blue-500" />
                    <span>{level.label}</span>
                  </div>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-400" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </MotionButton>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Interview Setup</h1>
            <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Selected: <span className="font-medium">{formData.role}</span> • {formData.experience}
            </p>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Code className="w-5 h-5 mr-2 text-blue-500" />
                  Technologies & Skills (Optional)
                </h2>
                <p className={`mb-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select up to 5 technologies you want to focus on in this interview
                </p>
                <div className="flex flex-wrap gap-2">
                  {techStacks.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => handleTechStackToggle(tech)}
                      disabled={
                        !formData.techStack.includes(tech) &&
                        formData.techStack.length >= 5
                      }
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        formData.techStack.includes(tech)
                          ? 'bg-blue-500 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } transition-colors ${
                        !formData.techStack.includes(tech) &&
                        formData.techStack.length >= 5
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
                {formData.techStack.length > 0 && (
                  <p className={`mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Selected: {formData.techStack.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-500" />
                  Interview Difficulty
                </h2>
                <div className="space-y-3">
                  {difficultyLevels.map((level) => (
                    <div
                      key={level.value}
                      className={`p-4 rounded-lg border ${
                        formData.difficulty === level.value
                          ? isDark
                            ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                            : 'border-blue-500 bg-blue-50'
                          : isDark
                            ? 'border-gray-700 bg-gray-800'
                            : 'border-gray-200 bg-white'
                      } cursor-pointer`}
                      onClick={() => handleDifficultySelect(level.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full mr-3 ${
                              formData.difficulty === level.value
                                ? 'bg-blue-500'
                                : isDark
                                  ? 'bg-gray-600'
                                  : 'bg-gray-300'
                            }`}
                          />
                          <span className="font-medium capitalize">{level.label}</span>
                        </div>
                      </div>
                      <p
                        className={`mt-1 text-sm pl-7 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        {level.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCreateInterview}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                    ${isDark ? 'focus:ring-offset-gray-900' : ''} 
                    transition-colors
                    ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Interview...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Interview Questions
                    </div>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </MotionDiv>
    </div>
  );
};

export default InterviewCreate;