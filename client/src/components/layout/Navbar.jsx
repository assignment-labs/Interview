// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/actions/authActions";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // For handling clicks outside the dropdown menu
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Get auth state from Redux store
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('button[aria-label="Toggle menu"]')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Change title based on route
  const getNavbarTitle = () => {
    const path = location.pathname;
    
    // Display "AI InterviewMocker & JobPortal" for root and about pages
    if (path === "/" || path === "/about") {
      return "AslanAI";
    }
    
    // Display "AI InterviewMocker" for interviews page and its children
    if (path === "/interviews" || path.startsWith("/interviews/")) {
      return "AI InterviewMocker";
    }
    
    // Display "JobPortal" for jobs and companies pages and their children
    if (path === "/jobs" || path.startsWith("/jobs/") || 
        path === "/companies" || path.startsWith("/companies/")) {
      return "JobPortal";
    }
    
    // Default title for other pages
    return "JobPortal";
  };
  
  // Get appropriate color for current route
  const getTitleColor = () => {
    const path = location.pathname;
    
    // Use purple color for Interview Mocker pages
    if (path === "/" || path === "/about" || path === "/interviews" || path.startsWith("/interviews/")) {
      return "#300049"; 
    }
    
    // Use blue for JobPortal pages
    return "rgb(37, 99, 235)"; // Default blue color (blue-600)
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  // Determine active link
  const isActive = (path) => {
    const currentPath = location.pathname;
    const isInterviewSection = currentPath === "/interviews" || currentPath.startsWith("/interviews/");
    
    if (currentPath === path) {
      // If we're in the interviews section, use the purple color
      if (path === "/interviews" || (isInterviewSection && path === "/interviews")) {
        return "border-[#300049] text-[#300049]";
      }
      return "border-blue-500 text-blue-600";
    }
    
    return "border-transparent text-gray-500 hover:border-blue-300 hover:text-blue-700";
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="font-bold text-xl flex items-center space-x-2" style={{color: getTitleColor()}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{getNavbarTitle()}</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/jobs"
                className={`${isActive("/jobs")} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Find Jobs
              </Link>
              <Link
                to="/companies"
                className={`${isActive("/companies")} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Companies
              </Link>
              <Link
                to="/interviews"
                className={`${isActive("/interviews")} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                Interviews
              </Link>
              <Link
                to="/about"
                className={`${isActive("/about")} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200`}
              >
                About
              </Link>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <>
                {user && user.role === "employer" && (
                  <Link
                    to="/post-job"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Post a Job
                  </Link>
                )}

                {/* Profile dropdown */}
                <div className="ml-3 relative" ref={profileRef}>
                  <div>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                        <span className="text-blue-600 font-medium">
                          {user && user.name
                            ? user.name.charAt(0).toUpperCase()
                            : "U"}
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Dropdown menu with transition */}
                  <div 
                    className={`${
                      isProfileOpen ? "transform opacity-100 scale-100" : "transform opacity-0 scale-95 pointer-events-none"
                    } transition ease-in-out duration-200 origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100`}
                  >
                    <div className="px-4 py-3 text-sm text-gray-900 bg-gray-50 rounded-t-md">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="truncate text-gray-500 text-xs mt-1">{user.email}</p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to={
                          user.role === "employer"
                            ? "/dashboard/employer"
                            : "/dashboard/seeker"
                        }
                        className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </Link>

                      {user.role === "employer" ? (
                        <Link
                          to="/company-profile"
                          className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Company Profile
                        </Link>
                      ) : (
                        <Link
                          to="/profile"
                          className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          My Profile
                        </Link>
                      )}
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="group flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-800 hover:text-blue-600 px-4 py-2 text-sm font-medium flex items-center transition duration-150 ease-in-out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center transition duration-150 ease-in-out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition duration-150 ease-in-out"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu with slide animation */}
      <div
        ref={mobileMenuRef}
        className={`${
          isMenuOpen 
            ? "max-h-screen opacity-100 transition-all duration-300 ease-in-out" 
            : "max-h-0 opacity-0 overflow-hidden transition-all duration-300 ease-in-out"
        } sm:hidden`}
      >
                    <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50">
          <Link
            to="/jobs"
            className={`${
              location.pathname === "/jobs"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium rounded-r-md transition duration-150 ease-in-out`}
          >
            Find Jobs
          </Link>
          <Link
            to="/companies"
            className={`${
              location.pathname === "/companies"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium rounded-r-md transition duration-150 ease-in-out`}
          >
            Companies
          </Link>
          <Link
            to="/interviews"
            className={`${
              location.pathname === "/interviews"
                ? "bg-[#300049]/10 border-[#300049] text-[#300049]"
                : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium rounded-r-md transition duration-150 ease-in-out`}
          >
            Interviews
          </Link>
          <Link
            to="/about"
            className={`${
              location.pathname === "/about"
                ? "bg-gray-100 border-gray-500 text-gray-800"
                : "border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium rounded-r-md transition duration-150 ease-in-out`}
          >
            About
          </Link>
        </div>

        {isAuthenticated ? (
          <div className="pt-4 pb-3 border-t border-gray-200 bg-white">
            <div className="flex items-center px-4 py-2">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                  <span className="text-blue-600 font-medium">
                    {user && user.name
                      ? user.name.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user.name}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1 px-2">
              <Link
                to={
                  user.role === "employer"
                    ? "/dashboard/employer"
                    : "/dashboard/seeker"
                }
                className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition duration-150 ease-in-out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              {user.role === "employer" ? (
                <Link
                  to="/company-profile"
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition duration-150 ease-in-out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company Profile
                </Link>
              ) : (
                <Link
                  to="/profile"
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition duration-150 ease-in-out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>
              )}
              {user.role === "employer" && (
                <Link
                  to="/post-job"
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition duration-150 ease-in-out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post a Job
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition duration-150 ease-in-out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-4 pb-3 border-t border-gray-200 px-4">
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/login"
                className="text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-base font-medium flex items-center justify-center transition duration-150 ease-in-out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-base font-medium flex items-center justify-center transition duration-150 ease-in-out"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;