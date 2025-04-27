// src/components/jobs/CVMatcher.jsx
import React, { useState } from 'react';
import axios from 'axios';

const CVMatcher = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [jobListings, setJobListings] = useState([]);
  const [error, setError] = useState('');
  const [scrapingProgress, setScrapingProgress] = useState(null);

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
        setExtractedInfo(response.data.profileInfo);
        setScrapingProgress('Finding matching jobs across the web...');
        setJobListings(response.data.jobs || []);
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

  // Handle clicking on a job to navigate to the external site
  const navigateToJob = (url) => {
    window.open(url, '_blank');
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

      {/* Rest of component remains the same */}
      {/* Display extracted information when available */}
      {extractedInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Your Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Job Title</p>
              <p className="text-base text-gray-900">{extractedInfo.jobTitle || 'Not detected'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Experience</p>
              <p className="text-base text-gray-900">{extractedInfo.experience || 'Not detected'} years</p>
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
          {/* Job listings content remains the same */}
        </div>
      )}
      
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
          <p className="text-gray-700">Analyzing your CV and searching for matching jobs across multiple websites...</p>
          <p className="text-sm text-gray-500 mt-2">This might take a minute or two.</p>
        </div>
      )}
      
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
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVMatcher;