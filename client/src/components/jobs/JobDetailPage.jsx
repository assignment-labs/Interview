// src/components/jobs/JobDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchJobDetails();
    checkIfJobIsSaved();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      // Use relative URL instead of hardcoded URL
      const response = await axios.get(`http://localhost:5000/api/jobs/${id}`);
      
      if (response.data.success) {
        setJob(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkIfJobIsSaved = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // Use relative URL
      const response = await axios.get('http://localhost:5000/api/jobs/saved', config);
      
      if (response.data.success) {
        const saved = response.data.data.some(savedJob => savedJob._id === id);
        setIsSaved(saved);
      }
    } catch (err) {
      console.error('Error checking saved status:', err);
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      if (isSaved) {
        // Remove from saved jobs - use relative URL
        await axios.delete(`http://localhost:5000/api/jobs/saved/${id}`, config);
        setIsSaved(false);
      } else {
        // Add to saved jobs - use relative URL
        await axios.post(`http://localhost:5000/api/jobs/saved/${id}`, {}, config);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving/unsaving job:', err);
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
        <div className="spinner">Loading...</div>
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
                <button
                  onClick={handleSaveJob}
                  className={`flex items-center justify-center h-10 w-10 rounded-full ${
                    isSaved ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-700'
                  }`}
                >
                  <i className={`fas fa-bookmark ${isSaved ? 'text-blue-600' : 'text-white'}`}></i>
                </button>
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