// client/src/utils/cvMatchingService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Service to handle CV matching and job scraping
 */
class CVMatchingService {
  /**
   * Process a CV file to extract information and find matching jobs
   * @param {File} file - The CV file to process
   * @returns {Promise<Object>} - CV info and matched jobs
   */
  async processCV(file) {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('cv', file);

      // Send request to backend
      const response = await axios.post(`${API_URL}/cv/process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error processing CV:', error);
      throw new Error(error.response?.data?.message || 'Failed to process CV');
    }
  }

  /**
   * Find matching jobs based on profile information
   * @param {Object} profileInfo - The profile information
   * @returns {Promise<Array>} - Matching jobs
   */
  async findMatchingJobs(profileInfo) {
    try {
      // Send request to backend
      const response = await axios.post(`${API_URL}/scrape-jobs`, profileInfo, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.jobs || [];
    } catch (error) {
      console.error('Error finding matching jobs:', error);
      throw new Error(error.response?.data?.message || 'Failed to find matching jobs');
    }
  }
}

export default new CVMatchingService();