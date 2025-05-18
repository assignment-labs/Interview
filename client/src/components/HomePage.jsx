import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage = () => {
  // State for search input animation
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // State for scroll position to trigger animations
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
        staggerChildren: 0.2
      }
    }
  };
  
  const pulseAnimation = {
    initial: { scale: 1 },
    pulse: { 
      scale: [1, 1.05, 1],
      transition: { 
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Hero Section with animated gradient background */}
      <div className="relative bg-gray-900 text-white">
        {/* Animated Background Gradient */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-blue-800/80"
          style={{
            backgroundSize: '400% 400%',
            animation: 'gradient-animation 15s ease infinite',
          }}
        >
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
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
        
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <motion.div 
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200"
              variants={fadeInUp}
            >
              Find Your Dream Job Today
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-200"
              variants={fadeInUp}
            >
              Connect with top employers and discover opportunities that match your skills and ambitions
            </motion.p>
            
            {/* Search Bar with focus animation */}
            <motion.div 
              className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3"
              variants={fadeInUp}
            >
              <motion.div 
                className={`flex-1 bg-white rounded-lg overflow-hidden flex items-center px-4 py-2 shadow-md ${isSearchFocused ? 'ring-2 ring-blue-400' : ''}`}
                animate={isSearchFocused ? { scale: 1.02 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <i className="fas fa-search text-gray-400 mr-2"></i>
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  className="w-full py-2 px-1 focus:outline-none text-gray-800"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-lg overflow-hidden flex items-center px-4 py-2 shadow-md"
              >
                <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full py-2 px-1 focus:outline-none text-gray-800"
                />
              </motion.div>
              
              <motion.button 
                className="bg-blue-600 hover:bg-blue-700 transition text-white font-medium py-3 px-6 rounded-lg shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Search Jobs
              </motion.button>
            </motion.div>
            
            {/* Job Seeker / Employer Options */}
            <motion.div 
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  to="/register?type=seeker" 
                  className="block bg-white text-blue-600 hover:bg-gray-100 transition font-medium py-3 px-8 rounded-lg shadow-md"
                >
                  I'm looking for a job
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  to="/register?type=employer" 
                  className="block bg-blue-800 text-white hover:bg-blue-900 transition font-medium py-3 px-8 rounded-lg shadow-md"
                >
                  I'm hiring
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" fill="#ffffff">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial="hidden"
            animate={scrollY > 200 ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {[
              { value: "10k+", label: "Jobs Available" },
              { value: "5k+", label: "Companies" },
              { value: "25k+", label: "Job Seekers" },
              { value: "1k+", label: "Jobs Filled" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition duration-300 border border-gray-100"
              >
                <motion.div 
                  className="text-4xl font-bold text-blue-600 mb-2"
                  initial="initial"
                  animate="pulse"
                  variants={pulseAnimation}
                >
                  {stat.value}
                </motion.div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Featured Jobs Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={scrollY > 400 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Jobs</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover opportunities from top employers across industries
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate={scrollY > 450 ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {/* Job Card 1 */}
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition duration-300 border border-gray-100 group"
              variants={fadeInUp}
              whileHover={{ y: -8, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors duration-300">
                  <span className="text-blue-600 font-bold">GD</span>
                </div>
                <div>
                  <h3 className="font-medium text-lg text-gray-900">Senior Frontend Developer</h3>
                  <p className="text-gray-600">GlobalTech</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Full-time</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Remote</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">$80k-$120k</span>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt text-blue-600 mr-2 w-5"></i>
                  <span>New York, NY (Remote)</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-briefcase text-blue-600 mr-2 w-5"></i>
                  <span>5+ years experience</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-clock text-blue-600 mr-2 w-5"></i>
                  <span>Posted 2 days ago</span>
                </li>
              </ul>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to="/job/1" className="block text-center bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-medium py-2 px-4 rounded-lg mt-4 group-hover:shadow-md">
                  View Details
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Job Card 2 */}
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition duration-300 border border-gray-100 group"
              variants={fadeInUp}
              whileHover={{ y: -8, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors duration-300">
                  <span className="text-blue-600 font-bold">AC</span>
                </div>
                <div>
                  <h3 className="font-medium text-lg text-gray-900">Product Manager</h3>
                  <p className="text-gray-600">AppCore Solutions</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Full-time</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Hybrid</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">$90k-$130k</span>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt text-blue-600 mr-2 w-5"></i>
                  <span>San Francisco, CA</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-briefcase text-blue-600 mr-2 w-5"></i>
                  <span>3+ years experience</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-clock text-blue-600 mr-2 w-5"></i>
                  <span>Posted 1 week ago</span>
                </li>
              </ul>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to="/job/2" className="block text-center bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-medium py-2 px-4 rounded-lg mt-4 group-hover:shadow-md">
                  View Details
                </Link>
              </motion.div>
            </motion.div>
            
            {/* Job Card 3 */}
            <motion.div 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition duration-300 border border-gray-100 group"
              variants={fadeInUp}
              whileHover={{ y: -8, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-md flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors duration-300">
                  <span className="text-blue-600 font-bold">TF</span>
                </div>
                <div>
                  <h3 className="font-medium text-lg text-gray-900">Data Scientist</h3>
                  <p className="text-gray-600">TechFusion</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Full-time</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">On-site</span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">$110k-$150k</span>
              </div>
              
              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-map-marker-alt text-blue-600 mr-2 w-5"></i>
                  <span>Boston, MA</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-briefcase text-blue-600 mr-2 w-5"></i>
                  <span>4+ years experience</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <i className="fas fa-clock text-blue-600 mr-2 w-5"></i>
                  <span>Posted 3 days ago</span>
                </li>
              </ul>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to="/job/3" className="block text-center bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-medium py-2 px-4 rounded-lg mt-4 group-hover:shadow-md">
                  View Details
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="text-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={scrollY > 800 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/jobs" className="inline-block bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-300 font-medium py-3 px-8 rounded-lg shadow-md hover:shadow-lg">
                Browse All Jobs
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={scrollY > 1000 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to find your dream job or hire the perfect candidate
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            animate={scrollY > 1050 ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {/* Step 1 */}
            <motion.div 
              className="text-center relative p-8 group"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-white rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 border border-gray-100"></div>
              <div className="relative z-10">
                <motion.div 
                  className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300"
                  whileHover={{ rotate: 5 }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity }
                  }}
                >
                  <i className="fas fa-user-plus text-2xl text-blue-600"></i>
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Create Account</h3>
                <p className="text-gray-600">
                  Register as a job seeker or employer and complete your profile
                </p>
              </div>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              className="text-center relative p-8 group"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-white rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 border border-gray-100"></div>
              <div className="relative z-10">
                <motion.div 
                  className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300"
                  whileHover={{ rotate: 5 }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity, delay: 0.3 }
                  }}
                >
                  <i className="fas fa-search text-2xl text-blue-600"></i>
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {`${true ? 'Explore Jobs' : 'Post Jobs'}`}
                </h3>
                <p className="text-gray-600">
                  {`${true ? 'Search and filter jobs that match your skills and preferences' : 'Create job listings with detailed requirements and benefits'}`}
                </p>
              </div>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div 
              className="text-center relative p-8 group"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-white rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 border border-gray-100"></div>
              <div className="relative z-10">
                <motion.div 
                  className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300"
                  whileHover={{ rotate: 5 }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity, delay: 0.6 }
                  }}
                >
                  <i className="fas fa-check-circle text-2xl text-blue-600"></i>
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {`${true ? 'Apply & Get Hired' : 'Review & Hire'}`}
                </h3>
                <p className="text-gray-600">
                  {`${true ? 'Submit applications and connect with employers' : 'Evaluate applicants and find the perfect match for your team'}`}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Featured Categories Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={scrollY > 1400 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Job Categories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore opportunities across popular industries
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            initial="hidden"
            animate={scrollY > 1450 ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {[
              { icon: "fas fa-laptop-code", title: "Technology", jobs: "1,204" },
              { icon: "fas fa-bullhorn", title: "Marketing", jobs: "567" },
              { icon: "fas fa-chart-line", title: "Finance", jobs: "432" },
              { icon: "fas fa-heartbeat", title: "Healthcare", jobs: "867" },
              { icon: "fas fa-palette", title: "Design", jobs: "349" },
              { icon: "fas fa-graduation-cap", title: "Education", jobs: "517" },
              { icon: "fas fa-cogs", title: "Engineering", jobs: "893" },
              { icon: "fas fa-ellipsis-h", title: "More Categories", jobs: "2,500+" }
            ].map((category, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ 
                  y: -10,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.1)"
                }}
              >
                <Link 
                  to={`/jobs/${category.title.toLowerCase()}`} 
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 text-center block border border-gray-100 h-full"
                >
                  <motion.div 
                    className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-blue-200 transition-colors duration-300"
                    whileHover={{ rotate: 5 }}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                      delay: index * 0.1
                    }}
                  >
                    <i className={`${category.icon} text-blue-600`}></i>
                  </motion.div>
                  <h3 className="font-medium text-gray-900">{category.title}</h3>
                  <p className="text-blue-600 mt-1">{category.jobs} jobs</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* CTA Section with improved contrast */}
      <div className="py-16 relative overflow-hidden">
        {/* Background with better contrast for text */}
        <div className="absolute inset-0 bg-blue-700">
          {/* Overlay gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-800 to-blue-600"></div>
          
          {/* Wave pattern for visual interest but better contrast */}
          <div className="absolute inset-0 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="absolute bottom-0">
              <path fill="#FFFFFF" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,224C672,213,768,171,864,149.3C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* Content with improved contrast */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={scrollY > 1800 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7 }}
            className="py-8"
          >
            {/* Heading with stronger contrast */}
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-md">
              Ready to Start Your Journey?
            </h2>
            
            {/* Paragraph with improved visibility */}
            <p className="text-xl text-white max-w-2xl mx-auto mb-10 drop-shadow-sm">
              Join thousands of job seekers and employers who have found success on our platform
            </p>
            
            {/* Buttons with better contrast and clear distinction */}
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-6"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  to="/register?type=seeker" 
                  className="block bg-white text-blue-700 hover:bg-gray-50 transition font-semibold py-4 px-8 rounded-lg shadow-xl text-lg"
                >
                  Create Job Seeker Account
                </Link>
              </motion.div>
              
              <motion.div
                variants={fadeInUp}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link 
                  to="/register?type=employer" 
                  className="block bg-blue-900 text-white hover:bg-blue-950 transition font-semibold py-4 px-8 rounded-lg shadow-xl border-2 border-white/20 text-lg"
                >
                  Create Employer Account
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Bottom wave separator */}
        <div className="absolute bottom-0 left-0 right-0 z-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#1e3a8a">
            <path d="M0,32L80,37.3C160,43,320,53,480,64C640,75,800,85,960,80C1120,75,1280,53,1360,42.7L1440,32L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"></path>
          </svg>
        </div>
      </div>
      
      {/* Add CSS Animation Keyframes */}
      <style jsx>{`
        @keyframes gradient-animation {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        
        @keyframes gradient-shift {
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

export default HomePage;