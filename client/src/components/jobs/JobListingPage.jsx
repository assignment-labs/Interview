// src/pages/jobs/JobListingPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import CVMatcher from "./CVMatcher";
import { debounce } from "lodash";
import { checkAuthStatus } from "../../utils/authUtils"; // Add this import

const JobListingPage = () => {
  const navigate = useNavigate(); // Add navigate hook
  const [showCVMatcher, setShowCVMatcher] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    jobType: "",
    experience: "",
    location: "",
    search: "",
    salary: { min: "", max: "" },
    skills: [],
    datePosted: "" // "today", "week", "month"
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
  });
  const [activeFilter, setActiveFilter] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Check authentication status when component loads
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        setIsAuthenticated(authStatus.isAuthenticated);
        if (authStatus.isAuthenticated && authStatus.user) {
          setUserRole(authStatus.user.role);
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
        setIsAuthenticated(false);
      }
    };

    verifyAuth();
  }, []);

  // Debounced search function to avoid excessive API calls
  const debouncedFetchJobs = useCallback(
    debounce(() => {
      fetchJobs();
    }, 500),
    [filters, pagination.currentPage]
  );

  useEffect(() => {
    debouncedFetchJobs();
    return () => debouncedFetchJobs.cancel();
  }, [filters, pagination.currentPage, debouncedFetchJobs]);

  useEffect(() => {
    // Fetch saved jobs if user is logged in
    const fetchSavedJobs = async () => {
      try {
        // Check if user is authenticated
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("No token found, skipping saved jobs fetch");
          return;
        }

        // Ensure token has Bearer prefix
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        const config = {
          headers: {
            'Authorization': formattedToken
          }
        };

        const response = await axios.get("http://localhost:5000/api/jobs/saved", config);

        if (response.data.success) {
          // Extract just the job IDs from saved jobs
          const savedJobIds = response.data.data.map(job => job._id);
          setSavedJobs(savedJobIds);
        }
      } catch (err) {
        console.error("Error fetching saved jobs:", err);
        
        // If unauthorized, clear token and user data
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUserRole(null);
          // Don't redirect here, just handle the auth state
        }
      }
    };

    // Only fetch saved jobs if user is authenticated
    if (isAuthenticated) {
      fetchSavedJobs();
    }
  }, [isAuthenticated]); // Depend on isAuthenticated state

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Build query string from filters
      const queryParams = [];

      if (filters.search) {
        queryParams.push(`search=${encodeURIComponent(filters.search)}`);
      }

      if (filters.jobType) {
        queryParams.push(`jobType=${encodeURIComponent(filters.jobType)}`);
      }

      if (filters.experience) {
        queryParams.push(`experience=${encodeURIComponent(filters.experience)}`);
      }

      if (filters.location) {
        queryParams.push(`location=${encodeURIComponent(filters.location)}`);
      }

      if (filters.salary.min) {
        queryParams.push(`salaryMin=${encodeURIComponent(filters.salary.min)}`);
      }

      if (filters.salary.max) {
        queryParams.push(`salaryMax=${encodeURIComponent(filters.salary.max)}`);
      }

      if (filters.datePosted) {
        queryParams.push(`datePosted=${encodeURIComponent(filters.datePosted)}`);
      }

      if (filters.skills.length > 0) {
        queryParams.push(`skills=${encodeURIComponent(filters.skills.join(','))}`);
      }

      // Add pagination params
      queryParams.push(`page=${pagination.currentPage}`);
      queryParams.push("limit=10");

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      const response = await axios.get(`http://localhost:5000/api/jobs${queryString}`);

      if (response.data.success) {
        setJobs(response.data.data || []);

        // Update pagination info
        const total = response.data.pagination?.total || 0;
        const limit = response.data.pagination?.limit || 10;
        const totalPages = Math.ceil(total / limit);

        setPagination({
          ...pagination,
          totalPages: totalPages || 1,
          totalJobs: total,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Error fetching jobs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "salaryMin" || name === "salaryMax") {
      setFilters({
        ...filters,
        salary: {
          ...filters.salary,
          [name === "salaryMin" ? "min" : "max"]: value,
        },
      });
    } else {
      setFilters({
        ...filters,
        [name]: value,
      });
    }

    // Reset to first page when filters change
    setPagination({
      ...pagination,
      currentPage: 1,
    });
  };

  const handleSkillToggle = (skill) => {
    setFilters(prevFilters => {
      const updatedSkills = prevFilters.skills.includes(skill)
        ? prevFilters.skills.filter(s => s !== skill)
        : [...prevFilters.skills, skill];
      
      return {
        ...prevFilters,
        skills: updatedSkills,
      };
    });

    setPagination({
      ...pagination,
      currentPage: 1,
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({
        ...pagination,
        currentPage: newPage,
      });
    }
  };

  const toggleSaveJob = async (jobId) => {
    try {
      // Check if user is authenticated
      if (!isAuthenticated) {
        navigate('/login', { state: { from: '/jobs' } });
        return;
      }

      // Get token with proper formatting
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/login', { state: { from: '/jobs' } });
        return;
      }

      // Ensure token has Bearer prefix
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      const config = {
        headers: {
          'Authorization': formattedToken
        }
      };

      // Optimistic UI update
      if (savedJobs.includes(jobId)) {
        setSavedJobs(savedJobs.filter(id => id !== jobId));
        await axios.delete(`http://localhost:5000/api/jobs/saved/${jobId}`, config);
      } else {
        setSavedJobs([...savedJobs, jobId]);
        await axios.post(`http://localhost:5000/api/jobs/saved/${jobId}`, {}, config);
      }
    } catch (err) {
      console.error("Error toggling saved job:", err);
      
      // Handle authentication errors
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUserRole(null);
        navigate('/login', { state: { from: '/jobs' } });
      }
    }
  };

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

  // Popular Skills for filtering
  const popularSkills = [
    "JavaScript", "React", "Node.js", "Python", "Java", 
    "SQL", "AWS", "DevOps", "UX/UI", "Project Management"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="relative bg-blue-600 text-white">
        {/* Background Gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800"
          style={{
            backgroundSize: "200% 200%",
            animation: "gradient-animation 15s ease infinite",
          }}
        ></div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:flex md:items-center md:justify-between"
          >
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Find Your Perfect Job
              </h1>
              <p className="mt-2 text-blue-100 text-xl">
                Browse through{" "}
                <span className="font-semibold">
                  {pagination.totalJobs > 0 ? pagination.totalJobs : "available"}
                </span>{" "}
                opportunities and find your next career move
              </p>
            </div>
            <motion.div
              className="mt-6 md:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => setShowCVMatcher(!showCVMatcher)}
                className="inline-flex items-center px-5 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {showCVMatcher ? "Hide CV Matcher" : "Match Jobs to Your CV"}
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 80"
            fill="#f9fafb"
            preserveAspectRatio="none"
            className="w-full"
          >
            <path d="M0,0L48,5.3C96,11,192,21,288,26.7C384,32,480,32,576,26.7C672,21,768,11,864,16C960,21,1056,43,1152,53.3C1248,64,1344,64,1392,64L1440,64L1440,80L1392,80C1344,80,1248,80,1152,80C1056,80,960,80,864,80C768,80,672,80,576,80C480,80,384,80,288,80C192,80,96,80,48,80L0,80Z"></path>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CV Matcher */}
        <AnimatePresence>
          {showCVMatcher && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <CVMatcher />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="lg:col-span-1">
            <motion.div
              className="bg-white shadow-md rounded-lg p-6 sticky top-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
                Filters
                {Object.values(filters).some(value => 
                  value && (typeof value === 'string' ? value.length > 0 : 
                    Array.isArray(value) ? value.length > 0 : 
                    typeof value === 'object' ? Object.values(value).some(v => v) : false)
                ) && (
                  <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </h2>

              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search jobs..."
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg pr-10 py-3"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </form>

              {/* Job Type Filter */}
              <div className="mb-5">
                <label
                  htmlFor="jobType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Job Type
                </label>
                <select
                  id="jobType"
                  name="jobType"
                  value={filters.jobType}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              {/* Experience Filter */}
              <div className="mb-5">
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Experience Level
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={filters.experience}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                >
                  <option value="">All Levels</option>
                  <option value="Entry-level">Entry-level</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              {/* Location Filter */}
              <div className="mb-5">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="City, state, or remote"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg pl-10 py-2"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Rest of your filters */}
              {/* ... */}

              {/* Reset Filters */}
              <motion.button
                type="button"
                onClick={() => {
                  setFilters({
                    jobType: "",
                    experience: "",
                    location: "",
                    search: "",
                    salary: { min: "", max: "" },
                    skills: [],
                    datePosted: ""
                  });
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition duration-150"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Reset Filters
              </motion.button>
            </motion.div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {/* Job listings content */}
            {/* ... */}
            
            {/* Job cards */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <motion.div
                  animate={{
                    rotate: 360,
                    transition: {
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  className="rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
                ></motion.div>
              </div>
            ) : jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white shadow-md rounded-lg p-8 text-center"
              >
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Try adjusting your search or filter criteria to find more
                  opportunities.
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {jobs.map((job) => (
                  <motion.div
                    key={job._id}
                    variants={fadeInUp}
                    className="bg-white shadow-md rounded-lg p-6 transition duration-150 ease-in-out hover:shadow-lg border border-gray-100 hover:border-blue-100"
                    whileHover={{
                      y: -5,
                      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.1)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                      <div className="flex-1">
                        <Link
                          to={`/job/${job._id}`}
                          className="text-xl font-medium text-blue-600 hover:text-blue-800 hover:underline transition duration-150"
                        >
                          {job.title}
                        </Link>
                        <p className="text-gray-600 mt-1">{job.company}</p>
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1 text-blue-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{job.location}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end mt-2 sm:mt-0">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 flex items-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1 text-gray-400"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {formatDate(job.createdAt)}
                          </span>
                          
                          <button
                            onClick={() => toggleSaveJob(job._id)}
                            className="text-gray-400 hover:text-blue-500 focus:outline-none transition-colors"
                            aria-label={savedJobs.includes(job._id) ? "Unsave job" : "Save job"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-5 w-5 ${
                                savedJobs.includes(job._id) ? "text-blue-500 fill-current" : ""
                              }`}
                              viewBox="0 0 20 20"
                              fill={savedJobs.includes(job._id) ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth={savedJobs.includes(job._id) ? "0" : "1.5"}
                            >
                              <path
                                d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"
                              />
                            </svg>
                            </button>
                        </div>
                        
                        {job.salary?.min && job.salary?.max && (
                          <span className="mt-1 bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                            ${job.salary.min.toLocaleString()} - $
                            {job.salary.max.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                        {job.jobType}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                        {job.experience}
                      </span>
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-700 mb-2 font-medium">
                          Required Skills:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.skills.slice(0, 5).map((skill, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 5 && (
                            <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Job Description Preview */}
                    {job.description && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 flex justify-end">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          to={`/job/${job._id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-150"
                        >
                          View Details
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Link>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-md"
                  >
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing page{" "}
                          <span className="font-medium">
                            {pagination.currentPage}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">
                            {pagination.totalPages}
                          </span>{" "}
                          pages
                        </p>
                      </div>
                      <div>
                        <nav
                          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                          aria-label="Pagination"
                        >
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              handlePageChange(pagination.currentPage - 1)
                            }
                            disabled={pagination.currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                              pagination.currentPage === 1
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </motion.button>

                          {/* Show page numbers */}
                          {[...Array(pagination.totalPages)].map((_, i) => {
                            const pageNumber = i + 1;
                            // Only show current page, first, last, and pages around current
                            if (
                              pageNumber === 1 ||
                              pageNumber === pagination.totalPages ||
                              (pageNumber >= pagination.currentPage - 1 &&
                                pageNumber <= pagination.currentPage + 1)
                            ) {
                              return (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  key={pageNumber}
                                  onClick={() => handlePageChange(pageNumber)}
                                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                    pageNumber === pagination.currentPage
                                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                      : "text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  {pageNumber}
                                </motion.button>
                              );
                            } else if (
                              (pageNumber === 2 &&
                                pagination.currentPage > 3) ||
                              (pageNumber === pagination.totalPages - 1 &&
                                pagination.currentPage < pagination.totalPages - 2)
                            ) {
                              // Show ellipsis
                              return (
                                <span
                                  key={pageNumber}
                                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                >
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              handlePageChange(pagination.currentPage + 1)
                            }
                            disabled={
                              pagination.currentPage === pagination.totalPages
                            }
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${
                              pagination.currentPage === pagination.totalPages
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </motion.button>
                        </nav>
                      </div>
                    </div>

                    {/* Mobile pagination */}
                    <div className="flex items-center justify-between sm:hidden">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={pagination.currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 ${
                          pagination.currentPage === 1
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                      >
                        Previous
                      </motion.button>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">
                          {pagination.currentPage}
                        </span>{" "}
                        /{" "}
                        <span className="font-medium">
                          {pagination.totalPages}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 ${
                          pagination.currentPage === pagination.totalPages
                            ? "cursor-not-allowed opacity-50"
                            : ""
                        }`}
                      >
                        Next
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Add CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes gradient-animation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
};

export default JobListingPage;