// src/pages/JobApplyPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/apiUtils'; // Import the api utility instead of axios directly

const JobApplyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    coverLetter: '',
    resume: null
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate(`/login?redirect=/jobs/${id}/apply`);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // Check if user is a job seeker
    if (parsedUser.role !== 'jobseeker') {
      setError('Only job seekers can apply for jobs');
      setLoading(false);
      return;
    }

    fetchJobDetails();
  }, [id, navigate]);

  const fetchJobDetails = async () => {
    try {
      // Fetch job details using the api utility
      const jobResponse = await api.get(`/jobs/${id}`);
      
      if (jobResponse.data.success) {
        setJob(jobResponse.data.data);
      }

      // Check if user has already applied
      const applicationsResponse = await api.get('/applications/me');
      
      if (applicationsResponse.data.success) {
        const hasApplied = applicationsResponse.data.data.some(
          application => application.job?._id === id
        );

        if (hasApplied) {
          setError('You have already applied for this job');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      resume: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.coverLetter.trim()) {
      setError('Cover letter is required');
      setSubmitting(false);
      return;
    }

    try {
      // For this implementation, we'll just send the cover letter
      // In a real application, you'd need to handle file upload for the resume
      const applicationData = {
        coverLetter: formData.coverLetter
      };

      // Use the api utility to handle authentication automatically
      const response = await api.post(`/applications/${id}`, applicationData);
      
      setSubmitting(false);
      
      if (response.data.success) {
        // Navigate to applications page with success message
        navigate('/dashboard/seeker?tab=applications&status=applied');
      }
    } catch (err) {
      setSubmitting(false);
      setError(err.response?.data?.message || 'Error submitting application. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">Apply for Position</h1>
            {job && (
              <div className="mt-2">
                <p className="text-xl">{job.title}</p>
                <p className="text-blue-100">{job.company}</p>
                <div className="flex items-center mt-1 text-sm text-blue-100">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  <span>{job.location}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-6">
            {error ? (
              <div className="text-center">
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="fas fa-exclamation-circle text-red-500"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => navigate(`/jobs/${id}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Back to Job Details
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                    Cover Letter*
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows={10}
                      required
                      value={formData.coverLetter}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Introduce yourself and explain why you're a good fit for this position..."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Your cover letter is your opportunity to make a good first impression. Highlight your relevant skills and experience.
                  </p>
                </div>

                <div>
                  <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                    Resume (Optional)
                  </label>
                  <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <i className="fas fa-file-upload text-gray-400 text-3xl"></i>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="resume"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                        >
                          <span>Upload a file</span>
                          <input 
                            id="resume" 
                            name="resume" 
                            type="file" 
                            className="sr-only" 
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, DOCX up to 5MB
                      </p>
                    </div>
                  </div>
                  {formData.resume && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected file: {formData.resume.name}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    Your profile information will also be sent to the employer.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${id}`)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplyPage;