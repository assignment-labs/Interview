// src/components/interviews/CreateInterviewForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/apiUtils';

const techStackOptions = [
  'JavaScript', 'React', 'Angular', 'Vue', 'Node.js',
  'Python', 'Django', 'Flask', 'Java', 'Spring',
  'PHP', 'Laravel', '.NET', 'Ruby', 'Rails',
  'Go', 'Rust', 'Swift', 'Kotlin', 'C#',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
  'SQL', 'MongoDB', 'PostgreSQL', 'Redis', 'GraphQL',
  'Machine Learning', 'Data Science', 'Blockchain'
];

const roleOptions = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'DevOps Engineer',
  'Data Engineer',
  'Data Scientist',
  'ML Engineer',
  'Software Engineer',
  'QA Engineer',
  'UX/UI Designer',
  'Product Manager',
  'Project Manager'
];

const experienceOptions = [
  'Entry-level (0-2 years)',
  'Mid-level (3-5 years)',
  'Senior (6+ years)'
];

const CreateInterviewForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    role: '',
    experience: '',
    techStack: [],
    difficulty: 'medium'
  });
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRole, setCustomRole] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTechStackChange = (tech) => {
    if (formData.techStack.includes(tech)) {
      setFormData({
        ...formData,
        techStack: formData.techStack.filter(item => item !== tech)
      });
    } else {
      setFormData({
        ...formData,
        techStack: [...formData.techStack, tech]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const submitData = { 
        ...formData,
        role: isCustomRole ? customRole : formData.role
      };
      
      const res = await api.post('/interviews', submitData);
      
      // Redirect to the interview page
      navigate(`/interviews/${res.data.data._id}`);
    } catch (err) {
      console.error('Error creating interview:', err);
      setError(err.response?.data?.message || 'Failed to create interview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Role
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {roleOptions.slice(0, 6).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setFormData({ ...formData, role });
                setIsCustomRole(false);
              }}
              className={`py-2 px-4 rounded-md text-sm ${
                !isCustomRole && formData.role === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {role}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustomRole(true)}
            className={`py-2 px-4 rounded-md text-sm ${
              isCustomRole
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Other
          </button>
        </div>
        
        {!isCustomRole && (
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select a role</option>
            {roleOptions.map(role => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        )}
        
        {isCustomRole && (
          <input
            type="text"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            placeholder="Enter specific role"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        )}
      </div>
      
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Experience Level
        </label>
        <div className="flex flex-wrap gap-2">
          {experienceOptions.map(exp => (
            <button
              key={exp}
              type="button"
              onClick={() => setFormData({ ...formData, experience: exp })}
              className={`py-2 px-4 rounded-md text-sm ${
                formData.experience === exp
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {exp}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Difficulty Level
        </label>
        <div className="flex gap-4">
          {['easy', 'medium', 'hard'].map(level => (
            <label key={level} className="flex items-center">
              <input
                type="radio"
                name="difficulty"
                value={level}
                checked={formData.difficulty === level}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 capitalize">{level}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-gray-700 font-medium mb-2">
          Tech Stack (optional)
        </label>
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
          {techStackOptions.map(tech => (
            <button
              key={tech}
              type="button"
              onClick={() => handleTechStackChange(tech)}
              className={`py-1 px-3 rounded-full text-xs ${
                formData.techStack.includes(tech)
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Selected: {formData.techStack.length ? formData.techStack.join(', ') : 'None'}
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium text-white ${
            isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Interview...
            </span>
          ) : (
            'Create Interview'
          )}
        </button>
      </div>
    </form>
  );
};

export default CreateInterviewForm;