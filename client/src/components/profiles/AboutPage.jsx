// src/components/AboutPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaHandshake, FaLightbulb, FaUsers, FaMapMarkerAlt, FaEnvelope, FaPhone } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
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

const AboutPage = () => {
  const [stats, setStats] = useState({
    jobsCount: 0,
    employersCount: 0,
    jobSeekersCount: 0,
    applicationsCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // In a real application, you would fetch statistics from your backend
        const response = await axios.get('http://localhost:5000/api/stats');
        setStats(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        
        // Fallback to sample data if API not implemented yet
        setStats({
          jobsCount: 1042,
          employersCount: 328,
          jobSeekersCount: 5724,
          applicationsCount: 8546
        });
        setLoading(false);
        setError('Using sample data - API endpoint not implemented yet');
      }
    };

    fetchStats();
  }, []);

  // Team members data
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      title: 'CEO & Co-Founder',
      bio: 'Former HR executive with 15+ years of experience in talent acquisition.',
      image: '/images/team/sarah.jpg'
    },
    {
      name: 'Michael Chen',
      title: 'CTO & Co-Founder',
      bio: 'Tech entrepreneur with a passion for creating innovative HR solutions.',
      image: '/images/team/michael.jpg'
    },
    {
      name: 'Jessica Williams',
      title: 'Head of Customer Success',
      bio: 'Dedicated to ensuring both job seekers and employers achieve their goals.',
      image: '/images/team/jessica.jpg'
    },
    {
      name: 'David Rodriguez',
      title: 'Lead Developer',
      bio: 'Full-stack engineer focused on creating seamless user experiences.',
      image: '/images/team/david.jpg'
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-600 text-black py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              About Us
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-blue-600 max-w-3xl mx-auto font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Connecting talent with opportunity and helping you ace your interviews
            </motion.p>
          </div>
        </motion.div>
        
        {/* Animated wave SVG at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#F9FAFB" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Our Mission */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
      >
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 transform transition-all hover:shadow-xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center relative">
            Our Mission
            <div className="h-1 w-24 bg-blue-600 absolute bottom-0 left-1/2 transform -translate-x-1/2 mt-2 rounded-full"></div>
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              As a student completing my final year project, I witnessed firsthand how many of my fellow graduates struggled 
              to find jobs and navigate the intimidating world of professional interviews. This inspired me to create 
              AslanAI – a platform that not only connects talented individuals with employment 
              opportunities but also helps them prepare for real-world interviews.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              My mission with this project is twofold: to bridge the gap between job seekers and employers, and to 
              equip fresh graduates with the confidence and skills they need to succeed in interviews. By simulating 
              realistic interview environments and providing a comprehensive job portal, I aim to make the transition 
              from student to professional smoother and more accessible for everyone.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Section with Counter Animation */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl font-bold text-gray-900 mb-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Our Impact
          </motion.h2>
          
          {error && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 max-w-3xl mx-auto rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-md transform transition-all hover:shadow-xl hover:scale-105 border border-gray-100"
              variants={fadeIn}
            >
              <div className="text-5xl font-bold text-blue-600 mb-4">
                {loading ? (
                  <AiOutlineLoading3Quarters className="animate-spin mx-auto h-10 w-10 text-blue-600" />
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                  >
                    {new Intl.NumberFormat().format(stats.jobsCount)}
                  </motion.span>
                )}
              </div>
              <div className="text-gray-700 font-medium">Jobs Posted</div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-md transform transition-all hover:shadow-xl hover:scale-105 border border-gray-100" 
              variants={fadeIn}
            >
              <div className="text-5xl font-bold text-blue-600 mb-4">
                {loading ? (
                  <AiOutlineLoading3Quarters className="animate-spin mx-auto h-10 w-10 text-blue-600" />
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                  >
                    {new Intl.NumberFormat().format(stats.employersCount)}
                  </motion.span>
                )}
              </div>
              <div className="text-gray-700 font-medium">Companies</div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-md transform transition-all hover:shadow-xl hover:scale-105 border border-gray-100"
              variants={fadeIn}
            >
              <div className="text-5xl font-bold text-blue-600 mb-4">
                {loading ? (
                  <AiOutlineLoading3Quarters className="animate-spin mx-auto h-10 w-10 text-blue-600" />
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                  >
                    {new Intl.NumberFormat().format(stats.jobSeekersCount)}
                  </motion.span>
                )}
              </div>
              <div className="text-gray-700 font-medium">Job Seekers</div>
            </motion.div>
            
            <motion.div 
              className="bg-white p-8 rounded-lg shadow-md transform transition-all hover:shadow-xl hover:scale-105 border border-gray-100"
              variants={fadeIn}
            >
              <div className="text-5xl font-bold text-blue-600 mb-4">
                {loading ? (
                  <AiOutlineLoading3Quarters className="animate-spin mx-auto h-10 w-10 text-blue-600" />
                ) : (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                  >
                    {new Intl.NumberFormat().format(stats.applicationsCount)}
                  </motion.span>
                )}
              </div>
              <div className="text-gray-700 font-medium">Applications</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Our Story */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center relative">
          My Story
          <div className="h-1 w-20 bg-blue-600 absolute bottom-0 left-1/2  transform -translate-x-1/2 mt-2 rounded-full"></div>
        </h2>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="order-2 md:order-1"
          >
            <img 
              src="https://static.vecteezy.com/system/resources/previews/023/891/742/non_2x/story-telling-button-speech-bubble-banner-label-storytelling-vector.jpg" 
              alt="Our journey" 
              className="rounded-xl shadow-xl w-full hover:shadow-2xl transition-shadow duration-300 object-cover h-full" 
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="order-1 md:order-2"
          >
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              I created this platform in 2023 as my final year project, driven by my own experiences and observations as a student. 
              I noticed many of my peers struggling with two major challenges: finding relevant job opportunities and 
              feeling unprepared for professional interviews.
            </p>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              The idea sparked when I saw how nervous my classmates were before interviews and how many missed opportunities 
              resulted from lack of interview experience and preparation. I wanted to solve this by creating a platform where 
              freshers could not only find jobs but also practice interviewing in a realistic setting with AI technology.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              What began as an academic project has evolved into a practical solution that addresses real-world challenges 
              for new graduates. By combining a job portal with AI interview simulation, I've created a comprehensive tool 
              that helps bridge the gap between education and employment for fresh talent entering the workforce.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Values Section */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-b from-white to-gray-50 rounded-3xl my-8"
        initial="hidden" 
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-16 text-center relative">
          Our Values
          <div className="h-1 w-20 bg-blue-600 absolute bottom-0 left-1/2 transform -translate-x-1/2 mt-2 rounded-full"></div>
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500 transform transition-all hover:shadow-xl hover:-translate-y-2"
            variants={fadeIn}
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaHandshake className="text-3xl text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Integrity</h3>
            <p className="text-gray-600 text-center">
              We believe in honesty, transparency, and ethical practices in everything we do. We're committed to building trust with our users and partners.
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500 transform transition-all hover:shadow-xl hover:-translate-y-2" 
            variants={fadeIn}
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaLightbulb className="text-3xl text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Innovation</h3>
            <p className="text-gray-600 text-center">
              We continuously strive to improve our platform and services, embracing new technologies and ideas to provide the best possible experience.
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-blue-500 transform transition-all hover:shadow-xl hover:-translate-y-2"
            variants={fadeIn}
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUsers className="text-3xl text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Inclusion</h3>
            <p className="text-gray-600 text-center">
              We're dedicated to creating a platform that's accessible and beneficial to everyone, regardless of background, promoting diversity in the workplace.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Whether you're looking for your next career move or preparing for interviews, we're here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/register?type=seeker" 
                className="bg-white text-blue-600 hover:bg-gray-50 transition-all font-medium py-4 px-8 rounded-full shadow-lg inline-block"
              >
                Start as Job Seeker
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/register?type=employer" 
                className="bg-blue-900 text-white hover:bg-blue-800 transition-all font-medium py-4 px-8 rounded-full shadow-lg inline-block border border-blue-400"
              >
                Start as Employer
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Contact Section */}
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeIn}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-16 text-center relative">
          Contact Us
          <div className="h-1 w-20 bg-blue-600 absolute bottom-0 left-1/2 transform -translate-x-1/2 mt-2 rounded-full"></div>
        </h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h3>
            <p className="text-gray-600 mb-8">
              Have questions or feedback? I'd love to hear from you. The support team is always here to help with any questions about the platform.
            </p>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <FaMapMarkerAlt className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Address</p>
                  <p className="text-gray-600">123 Tech Street, Suite 456, San Francisco, CA 94107</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <FaEnvelope className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Email</p>
                  <p className="text-gray-600">support@jobportal.com</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <FaPhone className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-900 font-medium">Phone</p>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <motion.form 
              className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Your email"
                    required
                  />
                </div>
              </div>
              <div className="mb-6">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Subject of your message"
                  required
                />
              </div>
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows="5"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Your message"
                  required
                ></textarea>
              </div>
              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Send Message
              </motion.button>
            </motion.form>
          </div>
        </div>
      </motion.div>

      {/* Footer with subtle wave top */}
      <div className="bg-gray-900 text-white mt-16 relative">
        <div className="absolute top-0 left-0 right-0 transform -translate-y-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#111827" fillOpacity="1" d="M0,96L48,128C96,160,192,224,288,224C384,224,480,160,576,149.3C672,139,768,181,864,186.7C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} AiInterviewMocker & JobPortal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;