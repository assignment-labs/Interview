// src/components/profile/CompanyProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CompanyProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [socialMedia, setSocialMedia] = useState({
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    
    // If user is not an employer, redirect to appropriate dashboard
    if (parsedUser.role !== 'employer') {
      navigate('/dashboard/seeker');
      return;
    }

    // Fetch company profile data
    fetchCompanyProfileData(token);
  }, [navigate]);

  const fetchCompanyProfileData = async (token) => {
    setLoading(true);
    try {
      // Configure axios headers with token
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Fetch employer profile
      const profileResponse = await axios.get('http://localhost:5000/api/users/profile', config);
      const userData = profileResponse.data.data;
      setUser(userData);
      
      // Set logo preview if company has a logo
      if (userData.companyLogo) {
        setLogoPreview(`http://localhost:5000/${userData.companyLogo}`);
      }
      
      // Set social media links if they exist
      if (userData.socialMedia) {
        setSocialMedia({
          linkedin: userData.socialMedia.linkedin || '',
          twitter: userData.socialMedia.twitter || '',
          facebook: userData.socialMedia.facebook || '',
          instagram: userData.socialMedia.instagram || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Failed to load profile data. Please try again.');
      
      // If token is invalid or expired, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  
    try {
      setLoading(true);
      
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Get form data
      formData.append('name', e.target.name.value);
      formData.append('email', e.target.email.value);
      
      // Company specific fields
      if (e.target.companyName.value) {
        formData.append('companyName', e.target.companyName.value);
      }
      
      if (e.target.website.value) {
        formData.append('website', e.target.website.value);
      }
      
      if (e.target.location.value) {
        formData.append('location', e.target.location.value);
      }
      
      if (e.target.companyDescription.value) {
        formData.append('companyDescription', e.target.companyDescription.value);
      }
      
      if (e.target.industry && e.target.industry.value) {
        formData.append('industry', e.target.industry.value);
      }
      
      // Social media fields - only add if they exist and have values
      if (e.target.linkedin && e.target.linkedin.value) {
        formData.append('linkedin', e.target.linkedin.value);
      }
      
      if (e.target.twitter && e.target.twitter.value) {
        formData.append('twitter', e.target.twitter.value);
      }
      
      if (e.target.facebook && e.target.facebook.value) {
        formData.append('facebook', e.target.facebook.value);
      }
      
      if (e.target.instagram && e.target.instagram.value) {
        formData.append('instagram', e.target.instagram.value);
      }
      
      // Append company logo if uploaded
      if (companyLogo) {
        formData.append('companyLogo', companyLogo);
      }
      
      // Configure headers - Don't set Content-Type
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Send update request
      const response = await axios.put('http://localhost:5000/api/users/profile', formData, config);
      
      // Update local user data
      const updatedUser = response.data.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccessMessage('Company profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      // More detailed error message
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  const handleCompanyLogoChange = (e) => {
    const file = e.target.files[0];
    console.log("Selected file:", file); // Debug log
    
    if (file) {
      setCompanyLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    setLogoPreview(null);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Profile</h1>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-500"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="p-6">
            <form className="space-y-6" onSubmit={handleUpdateProfile}>
              {/* Company Logo */}
              <h3 className="text-3xl font-bold text-gray-900">Company Profile</h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <div className="relative">
                        <img
                          src={logoPreview}
                          alt="Company logo"
                          className="h-24 w-24 rounded-md object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 text-red-600 rounded-full p-1"
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-md bg-gray-200 flex items-center justify-center">
                        <i className="fas fa-building text-gray-400 text-3xl"></i>
                      </div>
                    )}
                  </div>
                  <label className="block">
                    <span className="sr-only">Choose company logo</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                      onChange={handleCompanyLogoChange}
                    />
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Upload a square logo image in JPG, PNG or GIF format, at least 300x300 pixels.
                </p>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Your Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      defaultValue={user?.name || ''}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      defaultValue={user?.email || ''}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="companyName"
                      id="companyName"
                      defaultValue={user?.companyName || ''}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Industry
                  </label>
                  <div className="mt-1">
                    <select
                      id="industry"
                      name="industry"
                      defaultValue={user?.industry || ''}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Select an industry</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Education">Education</option>
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Media">Media & Entertainment</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Construction">Construction</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Hospitality">Hospitality & Tourism</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="website"
                      id="website"
                      defaultValue={user?.website || ''}
                      placeholder="https://yourcompany.com"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="location"
                      id="location"
                      defaultValue={user?.location || ''}
                      placeholder="City, State, Country"
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700">
                    Company Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="companyDescription"
                      name="companyDescription"
                      rows={6}
                      defaultValue={user?.companyDescription || ''}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describe your company, mission, culture, and what makes it a great place to work..."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Brief description of your company. This will be visible to job seekers.
                  </p>
                </div>
              </div>

              {/* Social Media Links Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">
                      LinkedIn
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        <i className="fab fa-linkedin"></i>
                      </span>
                      <input
                        type="text"
                        name="linkedin"
                        id="linkedin"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        defaultValue={user?.socialMedia?.linkedin || ''}
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                      Twitter
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        <i className="fab fa-twitter"></i>
                      </span>
                      <input
                        type="text"
                        name="twitter"
                        id="twitter"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        defaultValue={user?.socialMedia?.twitter || ''}
                        placeholder="https://twitter.com/yourcompany"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                      Facebook
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        <i className="fab fa-facebook"></i>
                      </span>
                      <input
                        type="text"
                        name="facebook"
                        id="facebook"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        defaultValue={user?.socialMedia?.facebook || ''}
                        placeholder="https://facebook.com/yourcompany"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                      Instagram
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        <i className="fab fa-instagram"></i>
                      </span>
                      <input
                        type="text"
                        name="instagram"
                        id="instagram"
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        defaultValue={user?.socialMedia?.instagram || ''}
                        placeholder="https://instagram.com/yourcompany"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                  onClick={() => navigate('/dashboard/employer')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CompanyProfilePage;