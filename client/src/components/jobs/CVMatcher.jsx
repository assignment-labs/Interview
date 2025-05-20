// src/components/jobs/CVMatcher.jsx
import React, { useState, useEffect } from 'react';
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
  
  // Enhanced filtering options
  const [filterSettings, setFilterSettings] = useState({
    byJobTitle: true,
    bySkills: true,
    byLocation: false,
    byExperience: false,
    minimumMatchScore: 0.3,
    maximumResults: 20
  });
  
  // Filter UI visibility
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // All jobs data (before filtering)
  const [allJobsData, setAllJobsData] = useState([]);
  
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

      // Add file content as text for parsing
      const fileContent = await readFileAsText(file);
      formData.append('fileContent', fileContent);

      // Process CV with backend
      setScrapingProgress('Extracting information from your CV...');
      const response = await axios.post('http://localhost:5000/api/scraper/cv/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      });
      
      console.log('CV processing response:', response.data);
      
      if (response.data.success) {
        const profileInfo = response.data.profileInfo;
        setExtractedInfo(profileInfo);
        setScrapingProgress('Finding matching jobs...');
        
        // Fetch all jobs first, then perform client-side filtering
        const jobsResponse = await axios.get('http://localhost:5000/api/jobs?limit=100');
        
        if (!jobsResponse.data.success) {
          throw new Error('Failed to fetch jobs data');
        }
        
        // Store all jobs data
        const jobsData = jobsResponse.data.data || [];
        setAllJobsData(jobsData);
        console.log(`Fetched ${jobsData.length} jobs from API`);
        
        // Apply filtering
        filterJobs(jobsData, profileInfo, filterSettings);
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
  
  // New function to apply filtering based on settings
  const filterJobs = (jobsData, profileInfo, filters) => {
    if (!profileInfo) {
      setJobListings([]);
      return;
    }
    
    let filteredJobs = [...jobsData];
    
    // Apply job title filter
    if (filters.byJobTitle && profileInfo.jobTitle) {
      setScrapingProgress(`Filtering jobs matching "${profileInfo.jobTitle}" title...`);
      
      // Normalize and tokenize job title
      const jobTitleLower = profileInfo.jobTitle.toLowerCase().trim();
      const jobTitleWords = jobTitleLower.split(/[\s,\/&+()-]+/).filter(word => word.length > 2);
      
      // Create variants for common job titles to improve matching
      const jobVariants = createJobTitleVariants(jobTitleLower);
      
      filteredJobs = filteredJobs.filter(job => {
        if (!job.title) return false;
        
        const jobTitle = job.title.toLowerCase().trim();
        
        // Check for direct partial matches
        const directMatch = jobTitleWords.some(word => 
          jobTitle.includes(word)
        );
        
        // Check for variant matches
        const variantMatch = jobVariants.some(variant => 
          jobTitle.includes(variant)
        );
        
        return directMatch || variantMatch;
      });
      
      console.log(`Found ${filteredJobs.length} jobs after title filtering`);
    }
    
    // Apply location filter
    if (filters.byLocation && profileInfo.location) {
      setScrapingProgress(`Filtering jobs matching "${profileInfo.location}" location...`);
      
      const locationLower = profileInfo.location.toLowerCase().trim();
      const locationWords = locationLower.split(/[\s,]+/).filter(word => word.length > 2);
      
      filteredJobs = filteredJobs.filter(job => {
        if (!job.location) return false;
        
        const jobLocation = job.location.toLowerCase().trim();
        
        // Check for location matches
        return locationWords.some(word => jobLocation.includes(word));
      });
      
      console.log(`Found ${filteredJobs.length} jobs after location filtering`);
    }
    
    // Apply experience level filter
    if (filters.byExperience && profileInfo.experience) {
      setScrapingProgress('Filtering jobs by experience level...');
      
      const expYears = parseInt(profileInfo.experience);
      if (!isNaN(expYears)) {
        filteredJobs = filteredJobs.filter(job => {
          if (!job.experience) return true; // Keep if no experience specified
          
          // Map job experience levels to year ranges
          const expRanges = {
            'Entry-level': [0, 2],
            'Mid-level': [2, 5],
            'Senior': [5, 10],
            'Executive': [8, 100]
          };
          
          const range = expRanges[job.experience];
          if (!range) return true;
          
          // Check if candidate experience falls within range
          return expYears >= range[0] && expYears <= range[1];
        });
        
        console.log(`Found ${filteredJobs.length} jobs after experience filtering`);
      }
    }
    
    // Calculate match scores for each job
    filteredJobs = filteredJobs.map(job => {
      let matchScore = 0;
      
      // Title match score
      if (profileInfo.jobTitle) {
        const jobTitle = (job.title || '').toLowerCase();
        const candidateTitle = profileInfo.jobTitle.toLowerCase();
        const candidateTitleWords = candidateTitle.split(/[\s,\/&+()-]+/).filter(word => word.length > 2);
        
        const titleScore = calculateJobMatchScore(jobTitle, candidateTitle, candidateTitleWords, profileInfo.skills || []);
        matchScore += titleScore * 0.5; // Title is 50% of total score
      }
      
      // Skills match score
      if (filters.bySkills && profileInfo.skills && profileInfo.skills.length > 0) {
        const skillScore = calculateSkillsMatchScore(job.skills || [], profileInfo.skills);
        matchScore += skillScore * 0.4; // Skills are 40% of total score
      }
      
      // Location match score
      if (filters.byLocation && profileInfo.location && job.location) {
        const locationLower = profileInfo.location.toLowerCase().trim();
        const jobLocation = job.location.toLowerCase().trim();
        
        // Simple location matching
        if (jobLocation.includes(locationLower) || locationLower.includes(jobLocation)) {
          matchScore += 0.1; // Location is 10% of total score
        }
      }
      
      return {
        ...job,
        matchScore,
        titleMatch: matchScore > filters.minimumMatchScore
      };
    });
    
    // Filter by minimum match score
    filteredJobs = filteredJobs.filter(job => job.matchScore >= filters.minimumMatchScore);
    
    // Sort by match score
    filteredJobs.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit number of results
    if (filters.maximumResults > 0) {
      filteredJobs = filteredJobs.slice(0, filters.maximumResults);
    }
    
    setJobListings(filteredJobs);
    console.log(`Displaying ${filteredJobs.length} matched jobs`);
  };
  
  // Calculate skills match score
  const calculateSkillsMatchScore = (jobSkills, candidateSkills) => {
    if (!jobSkills || !jobSkills.length || !candidateSkills || !candidateSkills.length) {
      return 0;
    }
    
    const jobSkillsLower = jobSkills.map(skill => skill.toLowerCase().trim());
    const candidateSkillsLower = candidateSkills.map(skill => skill.toLowerCase().trim());
    
    // Count matching skills
    let matchCount = 0;
    
    for (const candidateSkill of candidateSkillsLower) {
      for (const jobSkill of jobSkillsLower) {
        if (jobSkill.includes(candidateSkill) || candidateSkill.includes(jobSkill)) {
          matchCount++;
          break;
        }
      }
    }
    
    // Calculate match percentage
    const candidateSkillsCount = candidateSkillsLower.length;
    const jobSkillsCount = jobSkillsLower.length;
    
    // Use harmonic mean to balance the importance of matching both ways
    if (matchCount === 0) return 0;
    
    const candidateRatio = matchCount / candidateSkillsCount;
    const jobRatio = matchCount / jobSkillsCount;
    
    return 2 * (candidateRatio * jobRatio) / (candidateRatio + jobRatio);
  };
  
  // Create variants of common job titles to improve matching
  const createJobTitleVariants = (jobTitle) => {
    const variants = [];
    
    // Common job title equivalents
    const jobEquivalents = {
      'engineer': ['engineer', 'developer', 'programmer', 'coder', 'technician'],
      'developer': ['developer', 'engineer', 'programmer', 'coder'],
      'designer': ['designer', 'artist', 'creative'],
      'manager': ['manager', 'director', 'lead', 'head', 'supervisor'],
      'assistant': ['assistant', 'associate', 'coordinator'],
      'administrator': ['administrator', 'admin', 'manager'],
      'analyst': ['analyst', 'specialist', 'consultant'],
      'executive': ['executive', 'officer', 'manager', 'director']
    };
    
    // Match job domains
    const domainMatches = {
      'software': ['software', 'application', 'web', 'mobile', 'frontend', 'backend', 'fullstack', 'full-stack', 'front-end', 'back-end'],
      'web': ['web', 'frontend', 'front-end', 'ui', 'website'],
      'data': ['data', 'database', 'sql', 'analytics', 'big data'],
      'ui': ['ui', 'ux', 'user interface', 'user experience', 'frontend'],
      'marketing': ['marketing', 'digital marketing', 'seo', 'content'],
      'sales': ['sales', 'business development', 'account'],
      'finance': ['finance', 'accounting', 'financial']
    };
    
    // Add the original job title
    variants.push(jobTitle);
    
    // Generate variants based on job title parts
    const words = jobTitle.split(/\s+/);
    
    // Look for role words (like "engineer")
    for (const word of words) {
      if (jobEquivalents[word]) {
        // Add equivalent roles
        for (const equivalent of jobEquivalents[word]) {
          if (equivalent !== word) {
            const newVariant = jobTitle.replace(word, equivalent);
            variants.push(newVariant);
          }
        }
      }
      
      // Look for domain words (like "software")
      if (domainMatches[word]) {
        for (const domain of domainMatches[word]) {
          if (domain !== word) {
            const newVariant = jobTitle.replace(word, domain);
            variants.push(newVariant);
          }
        }
      }
    }
    
    // Special case for "Software Engineer" and similar tech roles
    if (jobTitle.includes('software') || jobTitle.includes('developer') || jobTitle.includes('programmer')) {
      variants.push('engineer');
      variants.push('developer');
      variants.push('programmer');
      variants.push('coder');
      variants.push('software');
      variants.push('web');
      variants.push('application');
    }
    
    return [...new Set(variants)]; // Remove duplicates
  };
  
  // Calculate match score between job title and candidate's job title
  const calculateJobMatchScore = (jobTitle, candidateTitle, candidateTitleWords, candidateSkills = []) => {
    let score = 0;
    
    // 1. Direct title similarity (word overlap)
    let matchingWords = 0;
    for (const word of candidateTitleWords) {
      if (word.length > 2 && jobTitle.includes(word)) {
        matchingWords++;
        // Give higher weight to longer words (more specific terms)
        score += (word.length > 5) ? 0.15 : 0.1;
      }
    }
    
    // Bonus for high proportion of matching words
    if (matchingWords > 0 && candidateTitleWords.length > 0) {
      const matchRatio = matchingWords / candidateTitleWords.length;
      score += matchRatio * 0.3;
    }
    
    // 2. Exact role match bonuses
    const roles = ['engineer', 'developer', 'designer', 'manager', 'analyst', 'administrator'];
    for (const role of roles) {
      if (jobTitle.includes(role) && candidateTitle.includes(role)) {
        score += 0.25; // Significant bonus for exact role match
        break;
      }
    }
    
    // 3. Domain match bonuses (frontend, backend, fullstack, etc.)
    const domains = ['frontend', 'front-end', 'backend', 'back-end', 'fullstack', 'full-stack', 
                    'web', 'mobile', 'data', 'cloud', 'devops', 'security', 'ui', 'ux'];
    for (const domain of domains) {
      if (jobTitle.includes(domain) && candidateTitle.includes(domain)) {
        score += 0.2; // Good bonus for domain match
        break;
      }
    }
    
    // 4. Seniority match (junior, senior, lead, etc.)
    const seniorityLevels = ['junior', 'senior', 'lead', 'principal', 'head', 'chief'];
    for (const level of seniorityLevels) {
      if (jobTitle.includes(level) && candidateTitle.includes(level)) {
        score += 0.15;
        break;
      }
    }
    
    // Cap the score at 1.0
    return Math.min(score, 1.0);
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

  // Apply filters when filter settings change
  useEffect(() => {
    if (extractedInfo && allJobsData.length > 0) {
      filterJobs(allJobsData, extractedInfo, filterSettings);
    }
  }, [filterSettings]);

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

  // Update filter settings
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFilterSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Debugging helper function for API issues
  const checkApiStatus = async () => {
    setIsLoading(true);
    setScrapingProgress('Checking API connection...');
    
    try {
      // Check if API is responsive
      const response = await axios.get('http://localhost:5000/api/health');
      
      if (response.status === 200) {
        setScrapingProgress('API is connected, fetching job listings...');
        // Fetch available jobs to check data structure
        const jobsResponse = await axios.get('http://localhost:5000/api/jobs?limit=5');
        
        if (jobsResponse.data.success && jobsResponse.data.data.length > 0) {
          // Log the structure for debugging
          console.log('Job data structure example:', jobsResponse.data.data[0]);
          setScrapingProgress('Jobs API working correctly');
        } else {
          setError('Job API returned success but no jobs found. Please check database.');
        }
      } else {
        setError('API health check failed. Status: ' + response.status);
      }
    } catch (err) {
      console.error('API connection error:', err);
      setError(
        'Cannot connect to API. Please ensure the backend server is running at http://localhost:5000'
      );
    } finally {
      setIsLoading(false);
      setScrapingProgress(null);
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
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
            <button
              onClick={processCV}
              disabled={isLoading || !file}
              className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Find Matching Jobs'}
            </button>
            
            <button
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              disabled={isLoading}
              className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {showFilterOptions ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            {/* API Debug button */}
            <button
              onClick={checkApiStatus}
              disabled={isLoading}
              className="w-full md:w-auto inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Check API
            </button>
          </div>
        </div>
        
        {/* Enhanced Filter Options */}
        <AnimatePresence>
          {showFilterOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 bg-gray-50 p-4 rounded-md"
            >
              <h3 className="text-sm font-medium text-gray-700 mb-3">Filter Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-3">
                    <input
                      id="filter-job-title"
                      name="byJobTitle"
                      type="checkbox"
                      checked={filterSettings.byJobTitle}
                      onChange={handleFilterChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="filter-job-title" className="ml-2 block text-sm text-gray-700">
                      Filter by job title
                    </label>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <input
                      id="filter-skills"
                      name="bySkills"
                      type="checkbox"
                      checked={filterSettings.bySkills}
                      onChange={handleFilterChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="filter-skills" className="ml-2 block text-sm text-gray-700">
                      Filter by skills
                    </label>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <input
                      id="filter-location"
                      name="byLocation"
                      type="checkbox"
                      checked={filterSettings.byLocation}
                      onChange={handleFilterChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="filter-location" className="ml-2 block text-sm text-gray-700">
                      Filter by location
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="filter-experience"
                      name="byExperience"
                      type="checkbox"
                      checked={filterSettings.byExperience}
                      onChange={handleFilterChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="filter-experience" className="ml-2 block text-sm text-gray-700">
                      Filter by experience level
                    </label>
                  </div>
                </div>
                
                <div>
                  <div className="mb-3">
                    <label htmlFor="minimum-match" className="block text-sm text-gray-700 mb-1">
                      Minimum match score ({Math.round(filterSettings.minimumMatchScore * 100)}%)
                    </label>
                    <input
                      id="minimum-match"
                      name="minimumMatchScore"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={filterSettings.minimumMatchScore}
                      onChange={handleFilterChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="maximum-results" className="block text-sm text-gray-700 mb-1">
                      Maximum results to show
                    </label>
                    <select
                      id="maximum-results"
                      name="maximumResults"
                      value={filterSettings.maximumResults}
                      onChange={handleFilterChange}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="5">5 results</option>
                      <option value="10">10 results</option>
                      <option value="20">20 results</option>
                      <option value="50">50 results</option>
                      <option value="100">100 results</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    // Reset to default filter settings
                    setFilterSettings({
                      byJobTitle: true,
                      bySkills: true,
                      byLocation: false,
                      byExperience: false,
                      minimumMatchScore: 0.3,
                      maximumResults: 20
                    });
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
                {extractedInfo.jobTitle && filterSettings.byJobTitle && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Filtering by title
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Experience</p>
              <p className="text-base text-gray-900 flex items-center">
                {extractedInfo.experience || 'Not detected'} {extractedInfo.experience ? 'years' : ''}
                {extractedInfo.experience && filterSettings.byExperience && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Filtering by experience
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Location</p>
              <p className="text-base text-gray-900 flex items-center">
                {extractedInfo.location || 'Not detected'}
                {extractedInfo.location && filterSettings.byLocation && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Filtering by location
                  </span>
                )}
              </p>
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
                      {filterSettings.bySkills && (
                        <svg className="ml-1 h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
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
            {extractedInfo && (
              <span className="ml-2 text-sm text-gray-500">
                with minimum {Math.round(filterSettings.minimumMatchScore * 100)}% match score
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
                          to={`/job/${job._id}`}
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
                      to={`/job/${job._id}`}
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
                <p>We couldn't find any jobs matching your profile with the current filter settings. Try the following:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                  <li>Lower the minimum match score in filter settings</li>
                  <li>Disable some of the filters to see more results</li>
                  <li>Upload a more detailed CV with clearer job title and skills</li>
                  <li>Browse all available jobs on our job board</li>
                </ul>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => {
                    // Lower the minimum match score to see more results
                    setFilterSettings(prev => ({
                      ...prev,
                      minimumMatchScore: 0.1
                    }));
                  }}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                >
                  Lower match threshold
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