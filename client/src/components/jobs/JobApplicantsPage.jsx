// src/pages/JobApplicantsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const JobApplicantsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to view applicants');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        // Fetch job details
        const jobResponse = await axios.get(`http://localhost:5000/api/jobs/${id}`, config);
        setJob(jobResponse.data.data);

        // Fetch applications for this job
        const applicationsResponse = await axios.get(`http://localhost:5000/api/applications/job/${id}`, config);
        setApplications(applicationsResponse.data.data || []);
        
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching data. Please try again.');
        
        // If unauthorized, redirect to dashboard
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/dashboard/employer');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to update application status');
        return;
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.put(`http://localhost:5000/api/applications/${applicationId}`, {
        status: newStatus
      }, config);

      if (response.data.success) {
        // Update the application in the state
        setApplications(applications.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating application status. Please try again.');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">Applicants for Position</h1>
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
            
            {/* Applicants List */}
            {applications.length > 0 ? (
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied On
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
                            <div className="bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center">
                              <i className="fas fa-user text-gray-500"></i>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {application.applicant.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {application.applicant.email}
                              </div>
                            </div>
                          </div>
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
                          <button
                            onClick={() => handleStatusChange(application._id, 'reviewing')}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                            disabled={application.status === 'reviewing'}
                          >
                            Review
                          </button>
                          <button
                            onClick={() => handleStatusChange(application._id, 'shortlisted')}
                            className="text-blue-600 hover:text-blue-900 mr-2"
                            disabled={application.status === 'shortlisted'}
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleStatusChange(application._id, 'accepted')}
                            className="text-green-600 hover:text-green-900 mr-2"
                            disabled={application.status === 'accepted'}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusChange(application._id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            disabled={application.status === 'rejected'}
                          >
                            Reject
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
                    <i className="fas fa-user-friends text-gray-400 text-3xl"></i>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-500 mb-6">Your job listing hasn't received any applications yet.</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Link
                to="/dashboard/employer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicantsPage;