// src/components/jobs/CVMatcher.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CVMatcher = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [jobListings, setJobListings] = useState([]);
  const [error, setError] = useState('');
  const [scrapingProgress, setScrapingProgress] = useState(null);
  const [expandedJobs, setExpandedJobs] = useState({});
  const [filterByJobTitle, setFilterByJobTitle] = useState(true); // Default to filter by job title

  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  // Process the CV
  const processCV = async () => {
    if (!file) {
      setError('Please upload a CV first');
      return;
    }

    setIsLoading(true);
    setError('');
    setScrapingProgress('Analyzing your CV...');
    setJobListings([]);
    setExpandedJobs({});

    try {
      // Create form data
      const formData = new FormData();
      formData.append('cv', file);

      // Add file content as text for parsing (fix for potential backend issue)
      const fileContent = await readFileAsText(file);
      formData.append('fileContent', fileContent);

      // Process CV with backend
      setScrapingProgress('Extracting information from your CV...');
      const response = await axios.post('http://localhost:5000/api/scraper/cv/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        // Add withCredentials for CORS if needed
        withCredentials: true
      });
      
      if (response.data.success) {
        const profileInfo = response.data.profileInfo;
        setExtractedInfo(profileInfo);
        setScrapingProgress('Finding matching jobs...');
        
        // Get all jobs data
        let jobsData = response.data.jobs || [];
        
        // Filter by job title if option is enabled and a job title was extracted
        if (filterByJobTitle && profileInfo && profileInfo.jobTitle) {
          setScrapingProgress(`Filtering jobs matching "${profileInfo.jobTitle}" title...`);
          
          // Filter jobs that match the extracted job title
          const jobTitleWords = profileInfo.jobTitle.toLowerCase().split(/\s+/);
          jobsData = jobsData.filter(job => {
            const jobTitle = job.title.toLowerCase();
            // Check if any of the job title words match
            return jobTitleWords.some(word => 
              word.length > 3 && jobTitle.includes(word)
            );
          });
          
          // Add a title match score for sorting
          jobsData = jobsData.map(job => {
            const jobTitle = job.title.toLowerCase();
            let titleMatchScore = 0;
            
            // Calculate a simple match score based on word overlap
            jobTitleWords.forEach(word => {
              if (word.length > 3 && jobTitle.includes(word)) {
                titleMatchScore += 1;
              }
            });
            
            // Normalize score
            titleMatchScore = titleMatchScore / jobTitleWords.length;
            
            // Combine with existing match score if available
            const finalMatchScore = job.matchScore ? 
              (job.matchScore + titleMatchScore) / 2 : 
              titleMatchScore;
            
            return {
              ...job,
              matchScore: finalMatchScore,
              titleMatch: true
            };
          });
        }
        
        // Sort by match score if available
        if (jobsData.length > 0 && 'matchScore' in jobsData[0]) {
          jobsData.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        }
        
        setJobListings(jobsData);
      } else {
        setError(response.data.message || 'Failed to process CV');
      }
      
      setScrapingProgress(null);
    } catch (err) {
      console.error('Error processing CV:', err);
      setError(
        err.response?.data?.message || 
        'Failed to process your CV or find matching jobs. Please try again.'
      );
      setScrapingProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsText(file);
    });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();

    // Calculate the difference in days
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Toggle job description expansion
  const toggleJobExpansion = (jobId) => {
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  // Format match score as percentage
  const formatMatchScore = (score) => {
    if (score === undefined || score === null) return null;
    return `${Math.round(score * 100)}%`;
  };

  // Check if a skill matches any of the extracted skills
  const isMatchingSkill = (skill) => {
    if (!extractedInfo || !extractedInfo.skills || extractedInfo.skills.length === 0) {
      return false;
    }
    
    const normalizedSkill = skill.toLowerCase();
    return extractedInfo.skills.some(s => 
      s.toLowerCase() === normalizedSkill || 
      s.toLowerCase().includes(normalizedSkill) || 
      normalizedSkill.includes(s.toLowerCase())
    );
  };

  // Toggle job title filtering
  const toggleJobTitleFilter = () => {
    setFilterByJobTitle(!filterByJobTitle);
    // Reprocess CV if we have already processed it once
    if (extractedInfo) {
      processCV();
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Find Jobs Matching Your CV</h2>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
          <div className="flex-1 mb-4 md:mb-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload your CV/Resume
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT up to 5MB</p>
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-500">
                Selected file: {file.name}
              </p>
            )}
          </div>
          <div>
            <button
              onClick={processCV}
              disabled={isLoading || !file}
              className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Find Matching Jobs'}
            </button>
          </div>
        </div>
        
        {/* Filter by job title toggle */}
        <div className="mt-4 flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filterByJobTitle}
              onChange={toggleJobTitleFilter}
              className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
            />
            <span className="ml-2 text-sm text-gray-700">
              Filter jobs by my job title
            </span>
          </label>
          <div className="ml-2 group relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <div className="absolute left-0 bottom-full mb-2 w-60 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              When enabled, we'll find jobs with titles similar to your CV's role
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}
        
        {scrapingProgress && (
          <div className="mt-4">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-gray-700">{scrapingProgress}</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
      </div>

      {/* Display extracted information when available */}
      {extractedInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Your Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Job Title</p>
              <p className="text-base text-gray-900 flex items-center">
                {extractedInfo.jobTitle || 'Not detected'}
                {extractedInfo.jobTitle && filterByJobTitle && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Filtering jobs by this title
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Experience</p>
              <p className="text-base text-gray-900">{extractedInfo.experience || 'Not detected'} {extractedInfo.experience ? 'years' : ''}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p className="text-base text-gray-900">{extractedInfo.location || 'Not detected'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Industry</p>
              <p className="text-base text-gray-900">{extractedInfo.industry || 'Not detected'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Skills</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {extractedInfo.skills && extractedInfo.skills.length > 0 ? 
                  extractedInfo.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {skill}
                    </span>
                  )) : 
                  <span className="text-gray-700">No skills detected</span>
                }
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Display matched job listings */}
      {jobListings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Matching Jobs ({jobListings.length})
            {extractedInfo && extractedInfo.jobTitle && filterByJobTitle && (
              <span className="ml-2 text-sm text-gray-500">
                filtered by job title "{extractedInfo.jobTitle}"
              </span>
            )}
          </h3>
          
          <div className="space-y-4">
            {jobListings.map((job, index) => (
              <motion.div
                key={job._id || `job-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow ${
                  job.titleMatch ? 'border-l-4 border-l-green-500' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Link
                          to={`/jobs/${job._id}`}
                          className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {job.title}
                        </Link>
                        
                        {job.matchScore !== undefined && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {formatMatchScore(job.matchScore)} Match
                          </span>
                        )}
                        
                        {job.titleMatch && extractedInfo && extractedInfo.jobTitle && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Title Match
                          </span>
                        )}
                        
                        {job.isExternal && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                            External
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                        {job.location && (
                          <span className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {job.location}
                          </span>
                        )}
                        
                        {job.jobType && (
                          <span className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                            {job.jobType}
                          </span>
                        )}
                        
                        {job.experience && (
                          <span className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            {job.experience}
                          </span>
                        )}
                        
                        {job.createdAt && (
                          <span className="flex items-center">
                            <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Posted {formatDate(job.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 sm:mt-0">
                      {job.salary?.min && job.salary?.max && (
                        <div className="text-sm font-medium text-gray-900">
                          ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1.5">
                        {job.skills.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isMatchingSkill(skill) 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {skill}
                            {isMatchingSkill(skill) && (
                              <svg className="ml-1 h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Description Preview */}
                  {job.description && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleJobExpansion(job._id || `job-${index}`)}
                        className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none flex items-center"
                      >
                        <span>
                          {expandedJobs[job._id || `job-${index}`] ? 'Hide details' : 'Show details'}
                        </span>
                        <svg 
                          className={`ml-1 h-4 w-4 transform transition-transform ${
                            expandedJobs[job._id || `job-${index}`] ? 'rotate-180' : ''
                          }`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      <AnimatePresence>
                        {expandedJobs[job._id || `job-${index}`] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-2 text-sm text-gray-600 overflow-hidden"
                          >
                            <p className="whitespace-pre-line">
                              {job.description.length > 300
                                ? `${job.description.substring(0, 300)}...`
                                : job.description
                              }
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="mt-4 flex justify-end">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                    >
                      View Job
                      <svg className="ml-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && jobListings.length === 0 && !error && (
        <div className="py-8 text-center">
          <svg 
            className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-700">Analyzing your CV and searching for matching jobs...</p>
          <p className="text-sm text-gray-500 mt-2">This might take a minute or two.</p>
        </div>
      )}
      
      {/* No matches state */}
      {!isLoading && extractedInfo && jobListings.length === 0 && !error && (
        <div className="bg-yellow-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No matching jobs found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>We couldn't find any jobs matching your profile. Try the following:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Check if your CV is up-to-date with your latest skills and experience</li>
                  <li>Try uploading a more detailed CV</li>
                  <li>Consider broadening your search criteria</li>
                  <li>Or browse all available jobs on our job board</li>
                </ul>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={processCV}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                >
                  Try again
                </button>
                <Link
                  to="/jobs"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Browse all jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVMatcher;