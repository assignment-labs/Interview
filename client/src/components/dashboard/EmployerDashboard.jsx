// src/pages/dashboard/EmployerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const EmployerDashboard = () => {
  const [user, setUser] = useState(null);
  const [postedJobs, setPostedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
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

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // If user is not an employer, redirect to appropriate dashboard
    if (parsedUser.role !== 'employer') {
      navigate('/dashboard/seeker');
      return;
    }
    
    // Fetch employer data
    fetchEmployerData(token);
  }, [navigate, location]);

  const fetchEmployerData = async (token) => {
    setLoading(true);
    try {
      // Configure axios headers with token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Fetch employer profile
      const profileResponse = await axios.get('http://localhost:5000/api/users/profile', config);
      setUser(profileResponse.data.data);
      
      // Fetch posted jobs
      const jobsResponse = await axios.get('http://localhost:5000/api/jobs/employer/me', config);
      setPostedJobs(jobsResponse.data.data || []);
      
      // Fetch applications for all posted jobs
      const jobIds = jobsResponse.data.data.map(job => job._id);
      
      // If there are no posted jobs, set applications to empty array
      if (jobIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }
      
      let allApplications = [];
      
      // Fetch applications for each job
      for (const jobId of jobIds) {
        try {
          const appResponse = await axios.get(`http://localhost:5000/api/applications/job/${jobId}`, config);
          if (appResponse.data.success && appResponse.data.data) {
            allApplications = [...allApplications, ...appResponse.data.data];
          }
        } catch (appErr) {
          console.error(`Error fetching applications for job ${jobId}:`, appErr);
        }
      }
      
      setApplications(allApplications);
      
    } catch (err) {
      console.error('Error fetching employer data:', err);
      setError('Failed to load dashboard data. Please try again.');
      
      // If token is invalid or expired, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
          <div className="flex items-center">
            <span className="text-gray-700 mr-4">
              {user?.companyName || user?.name}
            </span>
            <Link
              to="/company-profile"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-2"
            >
              <i className="fas fa-building mr-2"></i> Company Profile
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </button>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
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
              onClick={() => setActiveTab('posted-jobs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posted-jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-briefcase mr-2"></i> Posted Jobs
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
                      <p className="text-sm font-medium text-blue-600">Posted Jobs</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{postedJobs.length}</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <i className="fas fa-briefcase text-blue-600"></i>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('posted-jobs')} className="text-sm text-blue-600 mt-4 inline-block">
                    View all jobs →
                  </button>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-green-600">Applications</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{applications.length}</p>
                    </div>
                    <div className="bg-green-100 rounded-full p-3">
                      <i className="fas fa-file-alt text-green-600"></i>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('applications')} className="text-sm text-green-600 mt-4 inline-block">
                    Review applications →
                  </button>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Profile Completion</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">75%</p>
                    </div>
                    <div className="bg-purple-100 rounded-full p-3">
                      <i className="fas fa-user-check text-purple-600"></i>
                    </div>
                  </div>
                  <Link to="/company-profile" className="text-sm text-purple-600 mt-4 inline-block">
                    Complete profile →
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                
                {applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.slice(0, 3).map((application, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full p-2 mr-4">
                            <i className="fas fa-user text-blue-600"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              New application for {application.job?.title || 'Unknown Position'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link to="/post-job" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex items-center">
                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                      <i className="fas fa-plus text-blue-600"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Post a New Job</p>
                      <p className="text-sm text-gray-600">Create a new job listing</p>
                    </div>
                  </Link>
                  <Link to="/company-profile" className="bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex items-center text-left w-full">
                    <div className="bg-gray-200 rounded-full p-3 mr-4">
                      <i className="fas fa-edit text-gray-600"></i>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Update Company Profile</p>
                      <p className="text-sm text-gray-600">Edit your company information</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Posted Jobs Tab */}
          {activeTab === 'posted-jobs' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Your Posted Jobs</h3>
                <Link
                  to="/post-job"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    
                  <i className="fas fa-plus mr-2"></i> Post New Job
                </Link>
              </div>

              {postedJobs.length > 0 ? (
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posted Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applications
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {postedJobs.map((job) => (
                        <tr key={job._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              job.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {job.active ? 'Active' : 'Closed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {applications.filter(app => app.job?._id === job._id).length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/jobs/edit/${job._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                              Edit
                            </Link>
                            <Link to={`/jobs/${job._id}/applicants`} className="text-green-600 hover:text-green-900 mr-3">
                              View Applicants
                            </Link>
                            <button className="text-red-600 hover:text-red-900">
                              Close
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-200 rounded-full p-4">
                      <i className="fas fa-briefcase text-gray-400 text-3xl"></i>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Posted Yet</h3>
                  <p className="text-gray-500 mb-6">Start posting jobs to find the perfect candidates for your company.</p>
                  <Link
                    to="/post-job"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <i className="fas fa-plus mr-2"></i> Post Your First Job
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Applications Received</h3>

              {applications.length > 0 ? (
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job
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
                            <div className="flex items-center">
                              <div className="bg-gray-200 rounded-full h-10 w-10 flex items-center justify-center">
                                <i className="fas fa-user text-gray-500"></i>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {application.applicant?.name || 'Unknown Applicant'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {application.applicant?.email || 'No email available'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{application.job?.title || 'Unknown Position'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(application.appliedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                            <Link to={`/applications/${application._id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                              View
                            </Link>
                            {application.status !== 'accepted' && (
                              <button className="text-green-600 hover:text-green-900 mr-3">
                                Accept
                              </button>
                            )}
                            {application.status !== 'rejected' && (
                              <button className="text-red-600 hover:text-red-900">
                                Reject
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-200 rounded-full p-4">
                      <i className="fas fa-file-alt text-gray-400 text-3xl"></i>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-gray-500">You'll see applications from job seekers here once they apply to your job listings.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;