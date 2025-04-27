// controllers/jobScraperController.js
const jobScraperService = require('../services/jobScraperService');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
      
      // Better file handling - check if a file was uploaded
      if (!fileContent && req.files && req.files.cv) {
        const cvFile = req.files.cv;
        
        // Make sure the temp directory exists
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Save the file to temp directory if needed
        const tempFilePath = path.join(tempDir, `cv_${Date.now()}_${cvFile.name}`);
        await cvFile.mv(tempFilePath);
        
        // Read file content based on the file type
        try {
          fileContent = fs.readFileSync(tempFilePath, 'utf8');
          
          // Clean up the temp file after reading
          fs.unlinkSync(tempFilePath);
        } catch (readError) {
          console.error('Error reading file:', readError);
          throw new Error(`Unable to read CV file: ${readError.message}`);
        }
      }
      
      if (!fileContent) {
        return res.status(400).json({ 
          success: false, 
          message: 'CV content is required' 
        });
      }

      // Check if Gemini API key exists
      if (!process.env.GEMINI_API_KEY) {
        // Fallback to basic parsing if API key is missing
        console.warn('GEMINI_API_KEY not found. Using basic parsing instead.');
        const profileInfo = this.basicParseCV(fileContent);
        
        // Find matching jobs using basic parsing
        const jobs = await jobScraperService.findMatchingJobs(profileInfo);
        
        return res.json({
          success: true,
          profileInfo,
          jobs
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
        message: 'Failed to process CV: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Basic CV parsing as a fallback method
   * @param {string} cvText - CV text content
   * @returns {Object} - Basic structured CV information
   */
  basicParseCV(cvText) {
    const profileInfo = {
      jobTitle: '',
      experience: 0,
      skills: [],
      location: '',
      industry: ''
    };

    // Simple title detection
    const titleRegex = /\b(developer|engineer|designer|manager|analyst|architect|consultant|specialist|director|coordinator)\b/gi;
    const titleMatches = cvText.match(titleRegex);
    if (titleMatches && titleMatches.length > 0) {
      // Look for more specific job titles
      const specificTitles = [
        'software engineer', 'web developer', 'data scientist', 'project manager',
        'product manager', 'UX designer', 'UI designer', 'full stack developer',
        'frontend developer', 'backend developer', 'DevOps engineer', 'system administrator'
      ];
      
      let foundSpecific = false;
      for (const title of specificTitles) {
        if (cvText.toLowerCase().includes(title.toLowerCase())) {
          profileInfo.jobTitle = title;
          foundSpecific = true;
          break;
        }
      }
      
      if (!foundSpecific) {
        profileInfo.jobTitle = titleMatches[0];
      }
    }

    // Experience detection (looking for years)
    const expRegex = /\b(\d+)(?:\+)?\s*(?:years?|yrs?)(?:\s*of)?\s*experience\b/i;
    const expMatch = cvText.match(expRegex);
    if (expMatch && expMatch.length > 1) {
      profileInfo.experience = parseInt(expMatch[1], 10);
    }

    // Skills detection - common programming languages and technologies
    const commonSkills = [
      'javascript', 'python', 'java', 'c#', 'c++', 'ruby', 'php', 'swift',
      'kotlin', 'typescript', 'html', 'css', 'react', 'angular', 'vue',
      'node.js', 'express', 'django', 'flask', 'spring', 'aws', 'azure',
      'docker', 'kubernetes', 'git', 'sql', 'mongodb', 'postgresql',
      'mysql', 'nosql', 'agile', 'scrum', 'devops', 'cicd', 'testing',
      'ai', 'machine learning', 'data analysis', 'project management'
    ];
    
    for (const skill of commonSkills) {
      if (cvText.toLowerCase().includes(skill.toLowerCase())) {
        profileInfo.skills.push(skill);
      }
    }

    // Location detection - look for common location indicators
    const locationRegex = /\b(?:located in|based in|residing in|from)\s+([A-Za-z\s,]+)(?:\.|,|\n)/i;
    const locationMatch = cvText.match(locationRegex);
    if (locationMatch && locationMatch.length > 1) {
      profileInfo.location = locationMatch[1].trim();
    }

    // Industry detection - common industries
    const industries = [
      'technology', 'healthcare', 'finance', 'education', 'retail',
      'manufacturing', 'government', 'nonprofit', 'consulting', 'media',
      'entertainment', 'telecommunications', 'construction', 'real estate'
    ];
    
    for (const industry of industries) {
      if (cvText.toLowerCase().includes(industry.toLowerCase())) {
        profileInfo.industry = industry;
        break;
      }
    }

    return profileInfo;
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
      
      try {
        // Parse the JSON from the text
        // Find the JSON object in the response (it might be within markdown code blocks)
        const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                        generatedText.match(/```\n([\s\S]*?)\n```/) || 
                        generatedText.match(/{[\s\S]*?}/);
                        
        const jsonString = jsonMatch ? jsonMatch[0] : generatedText;
        const cleanJsonString = jsonString.replace(/```json\n|```\n|```/g, '');
        
        return JSON.parse(cleanJsonString);
      } catch (parseError) {
        console.error('Error parsing JSON from Gemini:', parseError);
        // Fallback to basic parsing if JSON parsing fails
        return this.basicParseCV(cvText);
      }
    } catch (error) {
      console.error('Error analyzing CV with Gemini:', error);
      // Fallback to basic parsing if Gemini API fails
      return this.basicParseCV(cvText);
    }
  }
}

module.exports = new JobScraperController();