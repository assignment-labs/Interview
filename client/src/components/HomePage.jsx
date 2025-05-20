import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Target, Award } from "lucide-react";

const HomePage = () => {
  
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const pulseAnimation = {
    initial: { scale: 1 },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop",
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Hero Section with animated gradient background */}
      <div className="relative bg-gray-900 text-white">
        {/* Animated Background Gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-blue-800/80"
          style={{
            backgroundSize: "400% 400%",
            animation: "gradient-animation 15s ease infinite",
          }}
        >
          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/10"
                style={{
                  width: Math.random() * 30 + 5 + "px",
                  height: Math.random() * 30 + 5 + "px",
                  top: Math.random() * 100 + "%",
                  left: Math.random() * 100 + "%",
                  animation: `float-${i % 3} ${
                    Math.random() * 10 + 15
                  }s linear infinite`,
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
              Advance Your Career Journey
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-200"
              variants={fadeInUp}
            >
              Find your dream job and master interview skills with AI-powered
              practice
            </motion.p>

            {/* User Options */}
            <motion.div
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
              variants={fadeInUp}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/jobs"
                  className="block bg-white text-blue-600 hover:bg-gray-100 transition font-medium py-3 px-8 rounded-lg shadow-md"
                >
                  Find Jobs
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/interviews"
                  className="block bg-blue-800 text-white hover:bg-blue-900 transition font-medium py-3 px-8 rounded-lg shadow-md"
                >
                  Practice Interviews
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 120"
            fill="#ffffff"
          >
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
              { value: "500+", label: "Interview Templates" },
              { value: "25k+", label: "Users" },
              { value: "95%", label: "Success Rate" },
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

      {/* AI Interview Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={
              scrollY > 400 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Master Your Interview Skills with AI
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Practice interviews in a real-world environment with our advanced
              AI technology
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            animate={scrollY > 450 ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div
              className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300 border border-gray-100"
              variants={fadeInUp}
              whileHover={{ y: -8, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                AI-Powered Feedback
              </h3>
              <p className="text-gray-600">
                Get instant, detailed feedback on your interview performance
                from our advanced AI system.
              </p>
            </motion.div>

            <motion.div
              className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300 border border-gray-100"
              variants={fadeInUp}
              whileHover={{ y: -8, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Industry-Specific Questions
              </h3>
              <p className="text-gray-600">
                Practice with questions tailored to your industry and experience
                level.
              </p>
            </motion.div>

            <motion.div
              className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition duration-300 border border-gray-100"
              variants={fadeInUp}
              whileHover={{ y: -8, boxShadow: "0 15px 30px rgba(0,0,0,0.1)" }}
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Performance Analytics
              </h3>
              <p className="text-gray-600">
                Track your progress and identify areas for improvement with
                detailed analytics.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={
              scrollY > 600 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/interview-practice"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Start Practicing <ArrowRight className="ml-2" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Featured Jobs Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={
              scrollY > 800 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Jobs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover opportunities from top employers across industries
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate={scrollY > 850 ? "visible" : "hidden"}
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
                  <h3 className="font-medium text-lg text-gray-900">
                    Senior Frontend Developer
                  </h3>
                  <p className="text-gray-600">GlobalTech</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  Full-time
                </span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  Remote
                </span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  $80k-$120k
                </span>
              </div>

              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <span className="text-blue-600 mr-2 w-5">📍</span>
                  <span>New York, NY (Remote)</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-blue-600 mr-2 w-5">💼</span>
                  <span>5+ years experience</span>
                </li>
              </ul>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/job/1"
                  className="block text-center bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-medium py-2 px-4 rounded-lg mt-4 group-hover:shadow-md"
                >
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
                  <h3 className="font-medium text-lg text-gray-900">
                    Product Manager
                  </h3>
                  <p className="text-gray-600">AppCore Solutions</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  Full-time
                </span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  Hybrid
                </span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  $90k-$130k
                </span>
              </div>

              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <span className="text-blue-600 mr-2 w-5">📍</span>
                  <span>San Francisco, CA</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-blue-600 mr-2 w-5">💼</span>
                  <span>3+ years experience</span>
                </li>
              </ul>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/job/2"
                  className="block text-center bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-medium py-2 px-4 rounded-lg mt-4 group-hover:shadow-md"
                >
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
                  <h3 className="font-medium text-lg text-gray-900">
                    Data Scientist
                  </h3>
                  <p className="text-gray-600">TechFusion</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 my-4">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  Full-time
                </span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  On-site
                </span>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  $110k-$150k
                </span>
              </div>

              <ul className="space-y-2 mb-4">
                <li className="flex items-center text-gray-600">
                  <span className="text-blue-600 mr-2 w-5">📍</span>
                  <span>Boston, MA</span>
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-blue-600 mr-2 w-5">💼</span>
                  <span>4+ years experience</span>
                </li>
              </ul>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/job/3"
                  className="block text-center bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white font-medium py-2 px-4 rounded-lg mt-4 group-hover:shadow-md"
                >
                  View Details
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={
              scrollY > 1000 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            transition={{ duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/jobs"
                className="inline-block bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-300 font-medium py-3 px-8 rounded-lg shadow-md hover:shadow-lg"
              >
                Browse All Jobs
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={
              scrollY > 1200 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to find your dream job and ace your interviews
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-4 gap-8"
            initial="hidden"
            animate={scrollY > 1250 ? "visible" : "hidden"}
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
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300"
                  whileHover={{ rotate: 5 }}
                  animate={{
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity },
                  }}
                >
                  <span className="text-2xl text-blue-600">1</span>
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-2 ">
                  Create Account
                </h3>
                <p className="text-gray-600">
                  Register and complete your professional profile
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
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300"
                  whileHover={{ rotate: 5 }}
                  animate={{
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity, delay: 0.3 },
                  }}
                >
                  <span className="text-2xl text-blue-600">2</span>
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Explore Jobs
                </h3>
                <p className="text-gray-600">
                  Search and filter jobs that match your skills and preferences
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
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300"
                  whileHover={{ rotate: 5 }}
                  animate={{
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity, delay: 0.6 },
                  }}
                >
                  <span className="text-2xl text-blue-600">3</span>
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Practice Interviews
                </h3>
                <p className="text-gray-600">
                  Use AI to prepare and practice for job interviews
                </p>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div
              className="text-center relative p-8 group"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="absolute inset-0 bg-white rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 border border-gray-100"></div>
              <div className="relative z-10">
                <motion.div
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300"
                  whileHover={{ rotate: 5 }}
                  animate={{
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity, delay: 0.9 },
                  }}
                >
                  <span className="text-2xl text-blue-600">4</span>
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Apply & Get Hired
                </h3>
                <p className="text-gray-600">
                  Submit applications and ace your interviews with confidence
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Interview Demo Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid md:grid-cols-2 gap-12 items-center"
            initial="hidden"
            animate={scrollY > 1600 ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <div className="rounded-lg overflow-hidden shadow-xl">
                <img
                  src="/api/placeholder/600/400"
                  alt="AI Interview Practice"
                  className="w-full h-auto"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeInUp} className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Why Choose Our Platform?
              </h2>
              <p className="text-lg text-gray-600">
                Our platform combines cutting-edge AI technology with proven job
                search strategies to help you succeed in your career journey.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center text-gray-700">
                  <ArrowRight className="text-blue-600 mr-2" />
                  <span>Real-time feedback and interview suggestions</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <ArrowRight className="text-blue-600 mr-2" />
                  <span>Curated job listings from top employers</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <ArrowRight className="text-blue-600 mr-2" />
                  <span>Customizable interview scenarios by industry</span>
                </li>
                <li className="flex items-center text-gray-700">
                  <ArrowRight className="text-blue-600 mr-2" />
                  <span>Comprehensive performance analysis</span>
                </li>
              </ul>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6"
              >
                <Link
                  to="/about"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Learn More <ArrowRight className="ml-2" />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden bg-blue-600">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700"></div>

          {/* Diagonal overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(30, 64, 175, 0.3) 0%, rgba(29, 78, 216, 0.4) 100%)",
            }}
          ></div>
        </div>

        {/* Content container */}
        <div className="relative z-10 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={
              scrollY > 1800 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            {/* Heading */}
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Advance Your Career?
            </h2>

            {/* Subheading */}
            <p className="text-xl text-white mb-10">
              Find your dream job and master interview skills all in one
              platform
            </p>

            {/* Buttons - centered and properly spaced */}
            <div className="flex flex-col sm:flex-row justify-center  sm:space-x-6 space-y-4 sm:space-y-0">
              <Link
                to="/register"
                className="inline-block bg-white text-blue-700 hover:bg-gray-50 transition font-medium mt-1 py-3 px-8 rounded-lg shadow-lg"
              >
                Create Free Account
              </Link>

              <Link
                to="/demo"
                className="inline-block bg-blue-800 text-white hover:bg-blue-900 transition font-medium py-3 px-8 mt-1 rounded-lg shadow-lg border border-blue-400/30"
              >
                Watch Demo
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Bottom wave separator */}
        <div className="absolute bottom-0 left-0 right-0 z-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 100"
            fill="#ffffff"
            preserveAspectRatio="none"
            className="w-full"
          >
            <path d="M0,0L80,10C160,20,320,40,480,40C640,40,800,20,960,10C1120,0,1280,0,1360,0L1440,0L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
          </svg>
        </div>
      </div>

      {/* Job Categories Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={
              scrollY > 2000 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore opportunities across in-demand industries
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            animate={scrollY > 2050 ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {[
              { icon: "💻", title: "Technology", jobs: "1,204" },
              { icon: "📊", title: "Marketing", jobs: "567" },
              { icon: "📈", title: "Finance", jobs: "432" },
              { icon: "🏥", title: "Healthcare", jobs: "867" },
              { icon: "🎨", title: "Design", jobs: "349" },
              { icon: "🎓", title: "Education", jobs: "517" },
              { icon: "⚙️", title: "Engineering", jobs: "893" },
              { icon: "•••", title: "More Categories", jobs: "2,500+" },
            ].map((category, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{
                  y: -10,
                  boxShadow: "0 15px 30px rgba(0,0,0,0.1)",
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
                      delay: index * 0.1,
                    }}
                  >
                    <span className="text-2xl">{category.icon}</span>
                  </motion.div>
                  <h3 className="font-medium text-gray-900">
                    {category.title}
                  </h3>
                  <p className="text-blue-600 mt-1">{category.jobs} jobs</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={
              scrollY > 2300 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hear from users who found success with our platform
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            animate={scrollY > 2350 ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            {/* Testimonial 1 */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition duration-300 border border-gray-100"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">👩‍💼</span>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg text-gray-900">
                    Sarah J.
                  </h3>
                  <p className="text-gray-600">Software Engineer</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "The AI interview practice helped me overcome my nervousness and
                prepared me for tough questions. I landed a job at my dream
                company after just 3 weeks!"
              </p>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition duration-300 border border-gray-100"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">👨‍💻</span>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg text-gray-900">
                    Michael T.
                  </h3>
                  <p className="text-gray-600">Product Manager</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "This platform combines everything I needed - job listings that
                match my skills and interview prep that helped me stand out from
                other candidates."
              </p>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition duration-300 border border-gray-100"
              variants={fadeInUp}
              whileHover={{ y: -10 }}
            >
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">👩‍🎓</span>
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-lg text-gray-900">
                    Emily R.
                  </h3>
                  <p className="text-gray-600">Marketing Specialist</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "As a recent graduate, I was nervous about interviews. The AI
                practice sessions gave me confidence and helped me improve my
                communication skills dramatically."
              </p>
            </motion.div>
          </motion.div>
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

        @keyframes float-0 {
          0% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.3;
          }
          33% {
            transform: translateY(-30px) translateX(30px) rotate(10deg);
            opacity: 0.6;
          }
          66% {
            transform: translateY(20px) translateX(-20px) rotate(-5deg);
            opacity: 0.4;
          }
          100% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.3;
          }
        }

        @keyframes float-1 {
          0% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-20px) translateX(-25px) rotate(-15deg);
            opacity: 0.5;
          }
          75% {
            transform: translateY(25px) translateX(15px) rotate(10deg);
            opacity: 0.3;
          }
          100% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.2;
          }
        }

        @keyframes float-2 {
          0% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.4;
          }
          20% {
            transform: translateY(30px) translateX(-10px) rotate(8deg);
            opacity: 0.7;
          }
          80% {
            transform: translateY(-15px) translateX(25px) rotate(-8deg);
            opacity: 0.5;
          }
          100% {
            transform: translateY(0) translateX(0) rotate(0);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
