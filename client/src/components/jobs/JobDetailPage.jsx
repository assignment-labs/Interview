// src/pages/jobs/JobDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import authHelpers from '../../utils/authHelpers';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);

  useEffect(() => {
    // Get authenticated user
    const currentUser = authHelpers.getCurrentUser();
    setUser(currentUser);

    // Setup auth token
    authHelpers.setupAuthToken();

    // Fetch job details and saved status
    fetchJobDetails();
    if (currentUser) {
      checkIfJobIsSaved();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const config = authHelpers.getAuthConfig();
      const response = await axios.get(`http://localhost:5000/api/jobs/${id}`, config);
      
      if (response.data.success) {
        setJob(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError(err.response?.data?.message || 'Error fetching job details. Please try again.');
      
      // Handle auth errors
      authHelpers.handleAuthError(err, navigate);
    } finally {
      setLoading(false);
    }
  };

  const checkIfJobIsSaved = async () => {
    if (!user) return;

    try {
      const config = authHelpers.getAuthConfig();
      const response = await axios.get('http://localhost:5000/api/jobs/saved', config);
      
      if (response.data.success) {
        // Extract just the job IDs from the saved jobs list
        const savedJobIds = response.data.data.map(job => job._id);
        // Check if the current job ID is in the list
        setIsSaved(savedJobIds.includes(id));
      }
    } catch (err) {
      console.error('Error checking saved status:', err);
      
      // Handle auth errors
      authHelpers.handleAuthError(err, navigate);
    }
  };

  // Save/unsave job
  const handleSaveJob = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setSaveInProgress(true);
      
      // Toggle the UI state for immediate feedback
      const newSavedState = !isSaved;
      setIsSaved(newSavedState);

      // Setup auth config
      const config = authHelpers.getAuthConfig();

      if (newSavedState) {
        // Save the job
        await axios.post(`http://localhost:5000/api/jobs/saved/${id}`, {}, config);
        console.log('Job saved successfully');
      } else {
        // Unsave the job
        await axios.delete(`http://localhost:5000/api/jobs/saved/${id}`, config);
        console.log('Job unsaved successfully');
      }
    } catch (err) {
      console.error('Error saving/unsaving job:', err);
      
      // Revert the UI state if the API call failed
      setIsSaved(isSaved); // Revert to the previous state
      
      // Show error message
      setError(err.response?.data?.message || 'Failed to update saved status. Please try again.');
      setTimeout(() => setError(''), 5000);
      
      // If the error is "already saved" and we were trying to save, update the UI
      if (err.response?.status === 400 && 
          err.response?.data?.message === 'Job is already saved' &&
          !isSaved) {
        setIsSaved(true);
      }
      
      // Handle auth errors
      authHelpers.handleAuthError(err, navigate);
    } finally {
      setSaveInProgress(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Error</h1>
              <p className="mt-4 text-gray-500">{error}</p>
              <Link to="/jobs" className="mt-6 inline-block text-blue-600 hover:text-blue-800">
                Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Job Not Found</h1>
              <p className="mt-4 text-gray-500">The job you're looking for doesn't exist or has been removed.</p>
              <Link to="/jobs" className="mt-6 inline-block text-blue-600 hover:text-blue-800">
                Browse All Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Job Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{job.title}</h1>
                <p className="text-blue-100 mt-1">{job.company}</p>
                <div className="flex flex-wrap items-center mt-2 text-sm text-blue-100">
                  <span className="flex items-center mr-4">
                    <i className="fas fa-map-marker-alt mr-1"></i> {job.location}
                  </span>
                  <span className="flex items-center mr-4">
                    <i className="fas fa-briefcase mr-1"></i> {job.jobType}
                  </span>
                  <span className="flex items-center">
                    <i className="fas fa-user-graduate mr-1"></i> {job.experience}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                {user && (
                  <button
                    onClick={handleSaveJob}
                    disabled={saveInProgress}
                    className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      isSaved ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-700'
                    }`}
                  >
                    {saveInProgress ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <i className={`fas fa-bookmark ${isSaved ? 'text-blue-600' : 'text-white'}`}></i>
                    )}
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex items-center">
              {job.salary?.min && job.salary?.max ? (
                <div className="flex items-center bg-blue-500 px-3 py-1.5 rounded-lg mr-4">
                  <i className="fas fa-money-bill-wave mr-2"></i>
                  <span>${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} / year</span>
                </div>
              ) : (
                <div className="flex items-center bg-blue-500 px-3 py-1.5 rounded-lg mr-4">
                  <i className="fas fa-money-bill-wave mr-2"></i>
                  <span>Salary not specified</span>
                </div>
              )}
              
              {job.applicationDeadline && (
                <div className="flex items-center bg-blue-500 px-3 py-1.5 rounded-lg">
                  <i className="fas fa-calendar-alt mr-2"></i>
                  <span>Apply before {formatDate(job.applicationDeadline)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Job Details */}
          <div className="p-6">
            {/* Action Buttons */}
            <div className="mb-8 flex">
              <Link
                to={`/jobs/${job._id}/apply`}
                className="flex-1 text-center bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium"
              >
                Apply Now
              </Link>
            </div>
            
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="text-gray-700 space-y-4 prose max-w-none">
                {job.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            
            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Company Information */}
            {job.employer && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Company</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">{job.employer.companyName || job.company}</h3>
                  {job.employer.companyDescription && (
                    <p className="mt-2 text-gray-700">{job.employer.companyDescription}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    {job.employer.location && (
                      <div className="flex items-center text-gray-600">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        <span>{job.employer.location}</span>
                      </div>
                    )}
                    {job.employer.website && (
                      <div className="flex items-center text-gray-600">
                        <i className="fas fa-globe mr-2"></i>
                        <a
                          href={job.employer.website.startsWith('http') ? job.employer.website : `https://${job.employer.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Company Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Contact Information */}
            {job.contactEmail && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="flex items-center text-gray-700">
                  <i className="fas fa-envelope mr-2 text-blue-600"></i>
                  <a href={`mailto:${job.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                    {job.contactEmail}
                  </a>
                </div>
              </div>
            )}
            
            {/* Application Button */}
            <div className="mt-8 text-center">
              <Link
                to={`/jobs/${job._id}/apply`}
                className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-md font-medium"
              >
                Apply for this Job
              </Link>
              <p className="mt-2 text-sm text-gray-500">
                {job.applicationDeadline
                  ? `Apply before ${formatDate(job.applicationDeadline)}`
                  : 'Apply as soon as possible'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;