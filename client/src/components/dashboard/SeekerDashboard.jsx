// src/pages/dashboard/SeekerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import api from '../../utils/apiUtils'; // Import your custom API instance

const SeekerDashboard = () => {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }

    // Check if there's a success message in the location state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }

    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    // Ensure token is properly formatted with Bearer prefix
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Update localStorage and axios headers with properly formatted token
    localStorage.setItem('token', formattedToken);
    
    // Update both axios instances
    axios.defaults.headers.common['Authorization'] = formattedToken;
    api.defaults.headers.common['Authorization'] = formattedToken;

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // If user is not a job seeker, redirect to appropriate dashboard
    if (parsedUser.role !== 'jobseeker') {
      navigate('/dashboard/employer');
      return;
    }
    
    // Fetch job seeker data
    fetchSeekerData(formattedToken);
  }, [navigate, location]);

  // Fetch all data for the job seeker dashboard
  const fetchSeekerData = async (token) => {
    setLoading(true);
    try {
      // Configure axios headers with token
      const config = {
        headers: {
          Authorization: token
        }
      };
      
      console.log('Making API call with token:', token);
      
      // First, try using the api instance
      try {
        // Fetch seeker profile
        const profileResponse = await api.get('/users/profile');
        setUser(profileResponse.data.data);
        
        // Continue with other API calls using the api instance
        try {
          const applicationsResponse = await api.get('/applications/me');
          console.log('Applications data:', applicationsResponse.data);
          setApplications(applicationsResponse.data.data || []);
        } catch (appErr) {
          console.error('Error fetching applications using api instance:', appErr);
          setApplications([]);
        }
        
        try {
          const savedJobsResponse = await api.get('/jobs/saved');
          console.log('Saved jobs data:', savedJobsResponse.data);
          setSavedJobs(savedJobsResponse.data.data || []);
        } catch (savedErr) {
          console.error('Error fetching saved jobs using api instance:', savedErr);
          setSavedJobs([]);
        }
        
        try {
          const skillsQuery = profileResponse.data.data.skills?.join(',') || '';
          const recommendedJobsResponse = await api.get('/jobs', {
            params: { 
              limit: 5,
              skills: skillsQuery
            }
          });
          setRecommendedJobs(recommendedJobsResponse.data.data || []);
        } catch (recErr) {
          console.error('Error fetching recommended jobs using api instance:', recErr);
          setRecommendedJobs([]);
        }
        
      } catch (profileErr) {
        console.error('Error fetching profile using api instance, falling back to direct axios:', profileErr);
        
        // Fallback to direct axios calls with config
        // Fetch seeker profile
        const profileResponse = await axios.get('http://localhost:5000/api/users/profile', config);
        setUser(profileResponse.data.data);
        
        // Fetch applications
        try {
          const applicationsResponse = await axios.get('http://localhost:5000/api/applications/me', config);
          console.log('Applications data (axios fallback):', applicationsResponse.data);
          setApplications(applicationsResponse.data.data || []);
        } catch (appErr) {
          console.error('Error fetching applications:', appErr);
          setApplications([]);
        }
        
        // Fetch saved jobs
        try {
          const savedJobsResponse = await axios.get('http://localhost:5000/api/jobs/saved', config);
          console.log('Saved jobs data (axios fallback):', savedJobsResponse.data);
          setSavedJobs(savedJobsResponse.data.data || []);
        } catch (savedErr) {
          console.error('Error fetching saved jobs:', savedErr);
          setSavedJobs([]);
        }
        
        // Fetch recommended jobs based on user skills
        try {
          // Use query parameters to filter jobs based on skills
          const skillsQuery = profileResponse.data.data.skills?.join(',') || '';
          const recommendedJobsResponse = await axios.get('http://localhost:5000/api/jobs', {
            params: { 
              limit: 5,
              skills: skillsQuery
            },
            ...config
          });
          setRecommendedJobs(recommendedJobsResponse.data.data || []);
        } catch (recErr) {
          console.error('Error fetching recommended jobs:', recErr);
          setRecommendedJobs([]);
        }
      }
      
    } catch (err) {
      console.error('Error fetching seeker data:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // If token is invalid or expired, redirect to login
      if (err.response?.status === 401) {
        console.log('Authentication failed, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Then add a function to handle removing jobs from saved list
  const handleRemoveFromSaved = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Ensure token is properly formatted
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  
      try {
        // First try using the api instance
        await api.delete(`/jobs/saved/${jobId}`);
      } catch (apiErr) {
        console.error('Error using api instance, falling back to direct axios:', apiErr);
        
        // Fallback to direct axios
        const config = {
          headers: {
            Authorization: formattedToken
          }
        };
        
        await axios.delete(`http://localhost:5000/api/jobs/saved/${jobId}`, config);
      }
      
      // Update the saved jobs state by removing the job
      setSavedJobs(savedJobs.filter(job => job._id !== jobId));
    } catch (err) {
      console.error('Error removing job from saved list:', err);
      setError('Failed to remove job from saved list. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    
    const fields = [
      !!user.name,
      !!user.email,
      !!user.phone,
      !!user.bio,
      !!user.location,
      user.skills && user.skills.length > 0,
      user.experience && user.experience.length > 0,
      user.education && user.education.length > 0
    ];
    
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message */}
      {successMessage && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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

        {/* Dashboard Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-home mr-2"></i> Overview
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-briefcase mr-2"></i> Recommended Jobs
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-file-alt mr-2"></i> Applications
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'saved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-bookmark mr-2"></i> Saved Jobs
            </button>
            <button
              onClick={handleLogout}
              className="ml-auto py-4 px-1 border-b-2 border-transparent text-sm font-medium text-red-500 hover:text-red-700 hover:border-red-300"
            >
              <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Applications</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{applications.length}</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <i className="fas fa-file-alt text-blue-600"></i>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('applications')} className="text-sm text-blue-600 mt-4 inline-block">
                    View all applications →
                  </button>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-green-600">Saved Jobs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{savedJobs.length}</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <i className="fas fa-bookmark text-green-600"></i>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('saved')} className="text-sm text-green-600 mt-4 inline-block">
                    View saved jobs →
                  </button>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Profile Completion</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{profileCompletion}%</p>
                    </div>
                    <div className="bg-purple-100 rounded-full p-3">
                      <i className="fas fa-user-check text-purple-600"></i>
                    </div>
                  </div>
                  <Link to="/profile" className="text-sm text-purple-600 mt-4 inline-block">
                    Complete profile →
                  </Link>
                </div>
              </div>

              {/* Recommended Jobs */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recommended Jobs</h3>
                
                {recommendedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedJobs.slice(0, 3).map((job) => (
                      <div key={job._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{job.title}</h4>
                            <p className="text-sm text-gray-600">{job.company}</p>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              <span>{job.location}</span>
                              <span className="mx-2">•</span>
                              <i className="fas fa-money-bill-wave mr-1"></i>
                              <span>{job.salary?.min && job.salary?.max ? `$${job.salary.min} - $${job.salary.max}` : 'Not specified'}</span>
                            </div>
                          </div>
                          <div>
                            <Link
                              to={`/job/${job._id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                              View Job
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center mt-4">
                      <button
                        onClick={() => setActiveTab('jobs')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View All Recommended Jobs
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Complete your profile to get job recommendations</p>
                  </div>
                )}
              </div>

              {/* Recent Applications */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Applications</h3>
                
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.slice(0, 3).map((application) => (
                      <div key={application._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{application.job?.title || 'Unknown Position'}</h4>
                            <p className="text-sm text-gray-600">{application.job?.company || 'Unknown Company'}</p>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <i className="fas fa-clock mr-1"></i>
                              <span>Applied on {new Date(application.appliedAt).toLocaleDateString()}</span>
                              <span className="mx-2">•</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                application.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                                application.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <Link
                              to={`/applications/${application._id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-center mt-4">
                      <button
                        onClick={() => setActiveTab('applications')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View All Applications
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">You haven't applied to any jobs yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommended Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recommended Jobs</h2>
              
              {recommendedJobs.length > 0 ? (
                <div className="space-y-4">
                  {recommendedJobs.map((job) => (
                    <div key={job._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                          <p className="text-md text-gray-600">{job.company}</p>
                          <div className="flex flex-wrap items-center mt-2 text-sm text-gray-500">
                            <div className="mr-4 mb-2">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              <span>{job.location}</span>
                            </div>
                            <div className="mr-4 mb-2">
                              <i className="fas fa-briefcase mr-1"></i>
                              <span>{job.jobType}</span>
                            </div>
                            <div className="mr-4 mb-2">
                              <i className="fas fa-money-bill-wave mr-1"></i>
                              <span>{job.salary?.min && job.salary?.max ? `$${job.salary.min} - $${job.salary.max}` : 'Not specified'}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">{job.description?.substring(0, 150)}...</p>
                          </div>
                          <div className="mt-2 flex flex-wrap">
                            {job.skills?.slice(0, 4).map((skill, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                {skill}
                              </span>
                            ))}
                            {job.skills?.length > 4 && (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                +{job.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Link
                            to={`/job/${job._id}`}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <i className="fas fa-eye mr-2"></i> View Job
                          </Link>
                          <button
                            onClick={async () => {
                              try {
                                await api.post(`/jobs/saved/${job._id}`);
                                setSavedJobs([...savedJobs, job]);
                                setSuccessMessage('Job saved successfully!');
                              } catch (err) {
                                setError('Failed to save job. It may already be saved.');
                              }
                            }}
                            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <i className="fas fa-bookmark mr-2"></i> Save Job
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <i className="fas fa-search text-2xl"></i>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    We couldn't find any jobs matching your profile. Try updating your skills or search for jobs manually.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/jobs/search"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Search All Jobs
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">My Applications</h2>
              
              {applications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((application) => (
                        <tr key={application._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {application.job?.title || 'Unknown Position'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {application.job?.company || 'Unknown Company'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                              application.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                              application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                              application.status === 'reviewing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link 
                              to={`/applications/${application._id}`} 
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <i className="fas fa-file-alt text-2xl"></i>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't applied to any jobs yet. Start exploring available positions!
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/jobs/search"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                  </div>
              )}
            </div>
          )}
          
          {/* Saved Jobs Tab */}
          {activeTab === 'saved' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Saved Jobs</h2>
              
              {savedJobs.length > 0 ? (
                <div className="space-y-4">
                  {savedJobs.map((job) => (
                    <div key={job._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="mb-4 md:mb-0">
                          <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                          <p className="text-md text-gray-600">{job.company}</p>
                          <div className="flex flex-wrap items-center mt-2 text-sm text-gray-500">
                            <div className="mr-4 mb-2">
                              <i className="fas fa-map-marker-alt mr-1"></i>
                              <span>{job.location}</span>
                            </div>
                            <div className="mr-4 mb-2">
                              <i className="fas fa-briefcase mr-1"></i>
                              <span>{job.jobType}</span>
                            </div>
                            <div className="mr-4 mb-2">
                              <i className="fas fa-money-bill-wave mr-1"></i>
                              <span>{job.salary?.min && job.salary?.max ? `$${job.salary.min} - $${job.salary.max}` : 'Not specified'}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">{job.description?.substring(0, 150)}...</p>
                          </div>
                          <div className="mt-2 flex flex-wrap">
                            {job.skills?.slice(0, 4).map((skill, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                {skill}
                              </span>
                            ))}
                            {job.skills?.length > 4 && (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                +{job.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <Link
                            to={`/job/${job._id}`}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <i className="fas fa-eye mr-2"></i> View Job
                          </Link>
                          <Link
                            to={`/apply/${job._id}`}
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <i className="fas fa-paper-plane mr-2"></i> Apply Now
                          </Link>
                          <button
                            onClick={() => handleRemoveFromSaved(job._id)}
                            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                          >
                            <i className="fas fa-trash-alt mr-2"></i> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <i className="fas fa-bookmark text-2xl"></i>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No saved jobs</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You haven't saved any jobs yet. Browse jobs and save the ones you're interested in.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/jobs/search"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Browse Jobs
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default SeekerDashboard;