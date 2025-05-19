// src/components/jobs/ApplicationDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ApplicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get token and ensure it has the Bearer prefix
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to view this application');
          setLoading(false);
          navigate('/login');
          return;
        }

        // Format token with Bearer prefix
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        // Update token in localStorage with proper format
        localStorage.setItem('token', formattedToken);
        
        // Set axios default authorization header
        axios.defaults.headers.common['Authorization'] = formattedToken;

        // Get user info
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          setUserRole(user.role || '');
        } catch (userErr) {
          console.error('Error parsing user data:', userErr);
          setUserRole('');
        }
        
        // Configure request headers with token
        const config = {
          headers: {
            'Authorization': formattedToken
          }
        };

        console.log('Fetching application with token:', formattedToken);

        // Fetch application details
        const response = await axios.get(`http://localhost:5000/api/applications/${id}`, config);
        
        if (response.data.success) {
          setApplication(response.data.data);
        } else {
          setError('Could not retrieve application details.');
        }
        
      } catch (err) {
        console.error('Error fetching application:', err);
        setError(err.response?.data?.message || 'Error fetching application details. Please try again.');
        
        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => navigate('/login'), 1000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleWithdrawApplication = async () => {
    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to withdraw an application');
        setTimeout(() => navigate('/login'), 1000);
        return;
      }

      // Ensure token has Bearer prefix
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const config = {
        headers: {
          'Authorization': formattedToken
        }
      };

      // Delete application
      const response = await axios.delete(`http://localhost:5000/api/applications/${id}`, config);
      
      if (response.data.success) {
        navigate('/dashboard/seeker?tab=applications', { 
          state: { message: 'Application withdrawn successfully' } 
        });
      } else {
        setError('Failed to withdraw application. Please try again.');
      }
    } catch (err) {
      console.error('Error withdrawing application:', err);
      setError(err.response?.data?.message || 'Error withdrawing application. Please try again.');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 1000);
      }
    }
  };

  const updateApplicationStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to update application status');
        setTimeout(() => navigate('/login'), 1000);
        return;
      }

      // Ensure token has Bearer prefix
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': formattedToken
        }
      };

      // Update application status
      const response = await axios.put(`http://localhost:5000/api/applications/${id}`, {
        status: newStatus
      }, config);

      if (response.data.success) {
        setApplication({
          ...application,
          status: newStatus
        });
      } else {
        setError('Failed to update application status. Please try again.');
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      setError(err.response?.data?.message || 'Error updating application status. Please try again.');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/login'), 1000);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
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

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Not Found</h1>
              {error && <p className="text-red-500 mb-6">{error}</p>}
              <p className="text-gray-500 mb-6">The application you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link 
                to={userRole === 'employer' ? '/dashboard/employer' : '/dashboard/seeker'} 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Dashboard
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
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">Application Details</h1>
                {application.job && (
                  <div className="mt-2">
                    <p className="text-xl">{application.job.title}</p>
                    <p className="text-blue-100">{application.job.company}</p>
                    <div className="flex items-center mt-1 text-sm text-blue-100">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      <span>{application.job.location}</span>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                  application.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                  application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                  application.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-white text-blue-600'
                }`}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
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
            )}
            
            {/* Application Details */}
            <div className="space-y-6">
              {/* Application Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Application Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Applied On</p>
                      <p className="font-medium">{formatDate(application.appliedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{formatDate(application.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Applicant Info - Visible to employers */}
              {userRole === 'employer' && application.applicant && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Applicant Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <div className="bg-gray-200 rounded-full h-12 w-12 flex items-center justify-center mr-4">
                        <i className="fas fa-user text-gray-500"></i>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium">{application.applicant.name}</h4>
                        <p className="text-gray-600">{application.applicant.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {application.applicant.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{application.applicant.phone}</p>
                        </div>
                      )}
                      {application.applicant.location && (
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">{application.applicant.location}</p>
                        </div>
                      )}
                    </div>
                    
                    {application.applicant.skills && application.applicant.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {application.applicant.skills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {application.applicant.bio && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-1">Bio</p>
                        <p>{application.applicant.bio}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Cover Letter */}
              {application.coverLetter && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cover Letter</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="prose max-w-none">
                      {application.coverLetter.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Resume */}
              {application.resume && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resume</h3>
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center">
                    <i className="fas fa-file-pdf text-red-500 text-2xl mr-3"></i>
                    <div className="flex-grow">
                      <p className="font-medium">Resume</p>
                      <p className="text-sm text-gray-500">Uploaded with application</p>
                    </div>
                    <a 
                      href={application.resume} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <i className="fas fa-download mr-2"></i> Download
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-8 flex justify-end space-x-4">
              <Link
                to={userRole === 'employer' ? '/dashboard/employer?tab=applications' : '/dashboard/seeker?tab=applications'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Applications
              </Link>
              
              {/* Employer Actions */}
              {userRole === 'employer' && (
                <div className="flex space-x-2">
                  {application.status !== 'shortlisted' && (
                    <button
                      onClick={() => updateApplicationStatus('shortlisted')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Shortlist
                    </button>
                  )}
                  {application.status !== 'accepted' && (
                    <button
                      onClick={() => updateApplicationStatus('accepted')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Accept
                    </button>
                  )}
                  {application.status !== 'rejected' && (
                    <button
                      onClick={() => updateApplicationStatus('rejected')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Reject
                    </button>
                  )}
                </div>
              )}
              
              {/* Job Seeker Actions */}
              {userRole === 'jobseeker' && application.status === 'pending' && (
                <button
                  onClick={handleWithdrawApplication}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Withdraw Application
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;