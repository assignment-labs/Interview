// src/components/CompanyDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const CompanyDetailPage = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');

  // Helper function to safely format salary or object values
  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    
    // If it's an object (like salary with min, max, currency)
    if (typeof value === 'object' && value !== null) {
      // Handle salary object specifically
      if ('min' in value && 'max' in value) {
        if (value.min === value.max) {
          return `${value.currency || '$'}${value.min}`;
        }
        return `${value.currency || '$'}${value.min} - ${value.currency || '$'}${value.max}`;
      }
      // For other objects, convert to string
      return JSON.stringify(value);
    }
    
    return value;
  };

  useEffect(() => {
    const fetchCompanyAndJobs = async () => {
      try {
        setLoading(true);
        
        // Fetch company details
        const companyRes = await axios.get(`http://localhost:5000/api/users/${id}`);
        
        // Only proceed if the user is an employer
        if (companyRes.data.data.role !== 'employer') {
          throw new Error('Not a valid company');
        }
        
        setCompany(companyRes.data.data);
        
        // Fetch jobs from this company
        const jobsRes = await axios.get(`http://localhost:5000/api/jobs?employer=${id}`);
        
        // Process job data to handle any complex objects like salary
        const processedJobs = jobsRes.data.data.map(job => ({
          ...job,
          // If salary is an object, format it as a string
          salary: formatValue(job.salary)
        }));
        
        setCompanyJobs(processedJobs);
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch company details');
        setLoading(false);
      }
    };

    fetchCompanyAndJobs();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 rounded-lg bg-white shadow-lg">
          <div className="flex flex-col items-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading company details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-red-50 border-l-4 border-red-500 p-6 my-4 rounded-r-lg shadow-md"
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-md text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </motion.div>
        <Link 
          to="/companies" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Companies
        </Link>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-lg mt-4">Company not found.</p>
          <Link 
            to="/companies" 
            className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Companies
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Company Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="w-24 h-24 bg-gray-100 rounded-lg shadow-md flex items-center justify-center overflow-hidden"
              >
                {company.companyLogo ? (
                  <img
                    src={company.companyLogo}
                    alt={company.companyName}
                    className="w-20 h-20 object-contain"
                  />
                ) : (
                  <span className="text-4xl font-bold text-blue-600">
                    {company.companyName?.charAt(0) || 'C'}
                  </span>
                )}
              </motion.div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{company.companyName}</h1>
              <div className="mt-3 flex flex-wrap items-center text-gray-600 gap-4">
                {company.industry && (
                  <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-sm font-medium">{company.industry}</span>
                  </div>
                )}
                {company.location && (
                  <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">{company.location}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a 
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Website
                    </a>
                  </div>
                )}
                <div className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-700">{companyJobs.length} open positions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Tabs Navigation */}
      <div className="block lg:hidden bg-white border-t border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 px-4 py-3 text-center font-medium ${
              activeTab === 'about' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 px-4 py-3 text-center font-medium ${
              activeTab === 'jobs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
            }`}
          >
            Jobs ({companyJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-center font-medium ${
              activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'
            }`}
          >
            Info
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Desktop Layout */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section - Always visible on desktop, conditionally on mobile */}
            {(activeTab === 'about' || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-hidden"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About {company.companyName}
                </h2>
                <div className="prose prose-blue max-w-none">
                  {company.companyDescription ? (
                    <p className="text-gray-700 leading-relaxed">{company.companyDescription}</p>
                  ) : (
                    <p className="text-gray-500 italic">No company description available.</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Open Positions - Always visible on desktop, conditionally on mobile */}
            {(activeTab === 'jobs' || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-hidden"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Open Positions
                </h2>
                {companyJobs.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 mt-4">No job postings available at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {companyJobs.map((job, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        key={job._id}
                      >
                        <Link
                          to={`/job/${job._id}`}
                          className="block bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all duration-300 hover:border-blue-300 transform hover:-translate-y-1"
                        >
                          <h3 className="font-medium text-lg text-gray-900 mb-2">{job.title}</h3>
                          <div className="flex flex-wrap gap-2 my-3">
                            {job.jobType && (
                              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                                {job.jobType}
                              </span>
                            )}
                            {job.remote && (
                              <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                                Remote
                              </span>
                            )}
                            {job.salary && (
                              <span className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full font-medium">
                                {job.salary}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 line-clamp-2 mb-3">{job.description}</p>
                          <div className="flex items-center text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{job.location || 'Location not specified'}</span>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar - Always visible on desktop, conditionally on mobile */}
          {(activeTab === 'info' || window.innerWidth >= 1024) && (
            <div className="lg:col-span-1 space-y-6">
              {/* Company Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-hidden"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Company Overview
                </h2>
                <ul className="space-y-4 divide-y divide-gray-100">
                  <li className="flex justify-between pt-4">
                    <span className="text-gray-600">Founded</span>
                    <span className="text-gray-900 font-medium">{company.foundedYear || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between pt-4">
                    <span className="text-gray-600">Company Size</span>
                    <span className="text-gray-900 font-medium">{company.companySize || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between pt-4">
                    <span className="text-gray-600">Industry</span>
                    <span className="text-gray-900 font-medium">{company.industry || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between pt-4">
                    <span className="text-gray-600">Headquarters</span>
                    <span className="text-gray-900 font-medium">{company.location || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between pt-4">
                    <span className="text-gray-600">Open Jobs</span>
                    <motion.span 
                      className="text-gray-900 font-medium bg-blue-100 px-3 py-1 rounded-full text-blue-800"
                      animate={{ 
                        scale: [1, 1.1, 1],
                      }}
                      transition={{ 
                        duration: 0.5,
                        repeat: 0,
                        repeatType: "mirror"
                      }}
                    >
                      {companyJobs.length}
                    </motion.span>
                  </li>
                </ul>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 overflow-hidden"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Information
                </h2>
                <ul className="space-y-4">
                  {company.email && (
                    <li className="group">
                      <a 
                        href={`mailto:${company.email}`} 
                        className="flex items-center p-3 rounded-lg hover:bg-blue-50 transition-colors duration-300"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-blue-600 group-hover:text-blue-800 transition-colors duration-300">{company.email}</p>
                        </div>
                      </a>
                    </li>
                  )}
                  {company.phone && (
                    <li className="group">
                      <a 
                        href={`tel:${company.phone}`} 
                        className="flex items-center p-3 rounded-lg hover:bg-blue-50 transition-colors duration-300"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Phone</p>
                          <p className="text-sm text-blue-600 group-hover:text-blue-800 transition-colors duration-300">{company.phone}</p>
                        </div>
                      </a>
                    </li>
                  )}
                  {company.website && (
                    <li className="group">
                      <a 
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center p-3 rounded-lg hover:bg-blue-50 transition-colors duration-300"
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Website</p>
                          <p className="text-sm text-blue-600 group-hover:text-blue-800 transition-colors duration-300">{company.website}</p>
                        </div>
                      </a>
                    </li>
                  )}
                  {company.location && (
                    <li className="group">
                      <div className="flex items-center p-3 rounded-lg hover:bg-blue-50 transition-colors duration-300">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Location</p>
                          <p className="text-sm text-gray-700">{company.location}</p>
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              </motion.div>

              {/* Call to Action */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-blue-600 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-white overflow-hidden"
              >
                <h3 className="text-lg font-semibold mb-2">Interested in this company?</h3>
                <p className="mb-4 text-blue-100">Check out their open positions and apply today!</p>
                <a
                  href="#jobs"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('jobs');
                    window.scrollTo({
                      top: document.querySelector('#jobs')?.offsetTop || 0,
                      behavior: 'smooth'
                    });
                  }}
                  className="inline-block bg-white text-blue-600 font-medium px-4 py-2 rounded-lg shadow hover:bg-blue-50 transition-colors duration-300"
                >
                  View All Jobs
                </a>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Back to top button - appears when scrolling down */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors duration-300"
          aria-label="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

export default CompanyDetailPage;