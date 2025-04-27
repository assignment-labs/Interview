const jobScraperService = require('../services/jobScraperService');
const axios = require('axios');
const fs = require('fs');

/**
 * Controller for job scraping functionality
 */
class JobScraperController {
  /**
   * Process a CV with Gemini API and find matching jobs
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processCV(req, res) {
    try {
      let fileContent = req.body.fileContent;
      
      // If no direct file content provided, check if a file was uploaded
      if (!fileContent && req.files && req.files.cv) {
        const cvFile = req.files.cv;
        
        // Read file content based on the file type
        fileContent = fs.readFileSync(cvFile.tempFilePath, 'utf8');
        
        // Clean up the temp file after reading
        fs.unlinkSync(cvFile.tempFilePath);
      }
      
      if (!fileContent) {
        return res.status(400).json({ 
          success: false, 
          message: 'CV content is required' 
        });
      }

      // Extract profile info from CV using Gemini API
      const profileInfo = await this.analyzeWithGemini(fileContent);
      
      // Find matching jobs
      const jobs = await jobScraperService.findMatchingJobs(profileInfo);
      
      res.json({
        success: true,
        profileInfo,
        jobs
      });
    } catch (error) {
      console.error('Error in processCV controller:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process CV',
        error: error.message
      });
    }
  }

  /**
   * Scrape jobs based on provided profile info (without CV processing)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async scrapeJobs(req, res) {
    try {
      const profileInfo = req.body;
      
      // Validate required parameters
      if (!profileInfo.jobTitle) {
        return res.status(400).json({ 
          success: false, 
          message: 'Job title is required for searching' 
        });
      }
      
      console.log(`Starting job search for: ${profileInfo.jobTitle} in ${profileInfo.location || 'any location'}`);
      
      // Find matching jobs
      const jobs = await jobScraperService.findMatchingJobs(profileInfo);
      
      res.json({
        success: true,
        count: jobs.length,
        jobs
      });
    } catch (error) {
      console.error('Error in scrapeJobs controller:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error scraping job listings',
        error: error.message
      });
    }
  }

  /**
   * Analyze CV text with Gemini API to extract structured information
   * @param {string} cvText - The CV text content
   * @returns {Promise<Object>} - Structured CV information
   */
  async analyzeWithGemini(cvText) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    try {
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
      
      const response = await axios.post(API_URL, {
        contents: [{
          parts: [{
            text: `Extract the following information from this CV:
            1. Job position/title
            2. Years of experience (numeric value)
            3. Key skills (list up to 10 most important ones)
            4. Location/country preference
            5. Industry or sector
            
            Format the response as a JSON object with these keys: 
            jobTitle, experience, skills (as array), location, industry.
            
            CV content:
            ${cvText}`
          }]
        }]
      });
      
      // Extract the text from Gemini's response
      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      // Parse the JSON from the text
      // Find the JSON object in the response (it might be within markdown code blocks)
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                      generatedText.match(/```\n([\s\S]*?)\n```/) || 
                      generatedText.match(/{[\s\S]*?}/);
                      
      const jsonString = jsonMatch ? jsonMatch[0] : generatedText;
      const cleanJsonString = jsonString.replace(/```json\n|```\n|```/g, '');
      
      return JSON.parse(cleanJsonString);
    } catch (error) {
      console.error('Error analyzing CV with Gemini:', error);
      throw new Error('Failed to analyze CV with AI');
    }
  }
}

module.exports = new JobScraperController();