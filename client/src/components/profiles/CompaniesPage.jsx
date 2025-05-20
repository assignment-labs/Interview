import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industry, setIndustry] = useState('');
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        // Get all users with role 'employer'
        const response = await axios.get('http://localhost:5000/api/users/companies');
        setCompanies(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch companies');
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Filter companies based on search term and industry
  const filteredCompanies = companies.filter(
    (company) =>
      company.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (industry === '' || company.industry === industry)
  );

  // Get unique industries for filter dropdown
  const industries = [...new Set(companies.map((company) => company.industry))].filter(Boolean);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section with animated gradient background */}
      <div className="relative bg-blue-700 text-white">
        {/* Animated Background Gradient */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800"
          style={{
            backgroundSize: '400% 400%',
            animation: 'gradient-animation 15s ease infinite',
          }}
        >
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: Math.random() * 30 + 5 + 'px',
                  height: Math.random() * 30 + 5 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animation: `float-${i % 3} ${Math.random() * 10 + 15}s linear infinite`,
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-3xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200"
              variants={fadeInUp}
            >
              Explore Top Companies
            </motion.h1>
            <motion.p 
              className="text-xl text-black max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Discover great places to work and build your career
            </motion.p>
          </motion.div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" fill="#ffffff">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-8 mb-10 border border-gray-100"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Companies
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="search"
                  className="w-full border border-gray-300 rounded-lg pl-10 px-4 py-3 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow"
                  placeholder="Enter company name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="md:w-1/4">
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <div className="relative">
                <select
                  id="industry"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-blue-500 focus:border-blue-500 appearance-none transition-all duration-200 shadow-sm hover:shadow"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  <option value="">All Industries</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <i className="fas fa-chevron-down text-gray-400"></i>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Companies List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-6 text-xl text-gray-600">Loading companies...</p>
          </div>
        ) : error ? (
          <motion.div 
            className="bg-red-50 border-l-4 border-red-500 p-6 my-6 rounded-r-lg shadow-md"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
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
              <div className="ml-4">
                <p className="text-lg text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        ) : filteredCompanies.length === 0 ? (
          <motion.div 
            className="text-center py-16 bg-white rounded-xl shadow-md border border-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
            <p className="text-xl text-gray-600">No companies found matching your criteria.</p>
            <button 
              onClick={() => {setSearchTerm(''); setIndustry('');}}
              className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {filteredCompanies.map((company, index) => (
              <motion.div
                key={company._id}
                variants={fadeInUp}
                custom={index}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                <Link
                  to={`/companies/${company._id}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 h-full flex flex-col border border-gray-100 group"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4 transition-colors duration-300 group-hover:bg-blue-200">
                      {company.companyLogo ? (
                        <img
                          src={company.companyLogo}
                          alt={company.companyName}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-blue-600">
                          {company.companyName?.charAt(0) || 'C'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{company.companyName}</h3>
                      <p className="text-gray-600">{company.industry}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
                    {company.companyDescription || 'No description available.'}
                  </p>

                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-map-marker-alt text-blue-600 mr-2 w-5"></i>
                      <span>{company.location || 'Location not specified'}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-globe text-blue-600 mr-2 w-5"></i>
                      <span className="truncate">{company.website || 'Website not available'}</span>
                    </div>

                    <div className="flex items-center text-gray-600">
                      <i className="fas fa-briefcase text-blue-600 mr-2 w-5"></i>
                      <span>{company.jobCount || 0} open positions</span>
                    </div>
                    
                    <div className="pt-3 mt-2 text-right">
                      <span className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-800 transition-colors">
                        View details 
                        <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination (if needed) */}
        {!loading && !error && filteredCompanies.length > 0 && (
          <motion.div 
            className="mt-12 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <nav className="flex items-center space-x-2">
              <motion.button 
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Previous
              </motion.button>
              <motion.button 
                className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                1
              </motion.button>
              <motion.button 
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                2
              </motion.button>
              <motion.button 
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                3
              </motion.button>
              <motion.button 
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Next
              </motion.button>
            </nav>
          </motion.div>
        )}
      </div>
      
      {/* Add CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes gradient-animation {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        
        @keyframes float-0 {
          0% { transform: translateY(0) translateX(0) rotate(0); opacity: 0.3; }
          33% { transform: translateY(-30px) translateX(30px) rotate(10deg); opacity: 0.6; }
          66% { transform: translateY(20px) translateX(-20px) rotate(-5deg); opacity: 0.4; }
          100% { transform: translateY(0) translateX(0) rotate(0); opacity: 0.3; }
        }
        
        @keyframes float-1 {
          0% { transform: translateY(0) translateX(0) rotate(0); opacity: 0.2; }
          25% { transform: translateY(-20px) translateX(-25px) rotate(-15deg); opacity: 0.5; }
          75% { transform: translateY(25px) translateX(15px) rotate(10deg); opacity: 0.3; }
          100% { transform: translateY(0) translateX(0) rotate(0); opacity: 0.2; }
        }
        
        @keyframes float-2 {
          0% { transform: translateY(0) translateX(0) rotate(0); opacity: 0.4; }
          20% { transform: translateY(30px) translateX(-10px) rotate(8deg); opacity: 0.7; }
          80% { transform: translateY(-15px) translateX(25px) rotate(-8deg); opacity: 0.5; }
          100% { transform: translateY(0) translateX(0) rotate(0); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default CompaniesPage;