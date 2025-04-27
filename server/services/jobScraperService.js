// services/jobScraperService.js
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Job = require('../models/Job');

/**
 * Service to handle job scraping from multiple job sites
 */
class JobScraperService {
  constructor() {
    // Initialize service
  }
  
  /**
   * Find matching jobs based on profile information
   * @param {Object} profileInfo - Structured profile information
   * @returns {Promise<Array>} - Array of matching jobs
   */
  async findMatchingJobs(profileInfo) {
    try {
      console.log(`Starting job search for: ${profileInfo.jobTitle} in ${profileInfo.location || 'any location'}`);
      
      // First, search our own database for matching jobs
      const internalJobs = await this.findInternalJobs(profileInfo);
      
      try {
        // Attempt to scrape external job boards
        // Collect jobs from different sources
        const jobsPromises = [
          this.scrapeLinkedInJobs(profileInfo.jobTitle, profileInfo.location),
          this.scrapeIndeedJobs(profileInfo.jobTitle, profileInfo.location),
          this.scrapeGlassdoorJobs(profileInfo.jobTitle, profileInfo.location)
        ];
        
        // Wait for all scrapers to complete
        const results = await Promise.allSettled(jobsPromises);
        
        // Collect successful results
        const externalJobs = results
          .filter(result => result.status === 'fulfilled')
          .flatMap(result => result.value);
          
        console.log(`Found ${externalJobs.length} jobs from external sources`);
        
        // Combine results and calculate match scores
        const allJobs = [...internalJobs, ...externalJobs];
        
        // Process the jobs with the profile info to calculate match scores
        return this.processJobResults(allJobs, profileInfo);
      } catch (error) {
        console.error('Error scraping external job boards:', error);
        
        // If external scraping fails, generate mock jobs as fallback
        const mockJobs = this.generateMockJobs(profileInfo);
        
        // Combine with internal jobs
        const allJobs = [...internalJobs, ...mockJobs];
        
        // Process the jobs with the profile info to calculate match scores
        return this.processJobResults(allJobs, profileInfo);
      }
    } catch (error) {
      console.error('Error in job scraping service:', error);
      
      // Return empty array instead of throwing to prevent cascading failures
      return [];
    }
  }

  /**
   * Find matching jobs within our own job database
   * @param {Object} profileInfo - The profile information
   * @returns {Promise<Array>} - Array of internal jobs
   */
  async findInternalJobs(profileInfo) {
    try {
      const { jobTitle, skills = [], location, experience } = profileInfo;
      
      // Build query conditions
      let query = {};
      
      // Text search for job title
      if (jobTitle) {
        // Note: This requires a text index on the Job model
        query.$text = { $search: jobTitle };
      }
      
      // Filter by location if provided
      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }
      
      // Filter by required skills (match any of the user's skills)
      if (skills && skills.length > 0) {
        // Find jobs that require any of the candidate's skills
        query.skills = { $in: skills.map(skill => new RegExp(skill, 'i')) };
      }
      
      // Map experience level
      if (experience !== undefined) {
        const experienceLevel = this.mapExperienceLevel(experience);
        if (experienceLevel) {
          query.experience = experienceLevel;
        }
      }
      
      // Filter only active jobs
      query.active = true;
      
      // Execute query with populate for employer details
      const jobs = await Job.find(query)
        .populate({
          path: 'employer',
          select: 'name companyName companyDescription location website'
        })
        .limit(20);
      
      // Transform to unified format
      return jobs.map(job => ({
        id: job._id.toString(),
        title: job.title,
        company: job.company || (job.employer ? job.employer.companyName : 'Unknown'),
        location: job.location,
        description: job.description,
        jobType: job.jobType,
        experience: job.experience,
        skills: job.skills,
        salary: job.salary,
        url: `/jobs/${job._id}`, // Internal URL
        source: 'Internal',
        postedDays: this.calculateDaysAgo(job.createdAt),
        isInternal: true
      }));
    } catch (error) {
      console.error('Error finding internal jobs:', error);
      return [];
    }
  }

  /**
   * LinkedIn job scraper
   */
  async scrapeLinkedInJobs(jobTitle, location) {
    try {
      console.log('Scraping LinkedIn jobs...');
      const searchUrl = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(jobTitle)}&location=${encodeURIComponent(location || '')}`;
      
      // Use puppeteer for LinkedIn to handle dynamic content
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // For running in some environments
      });
      
      const page = await browser.newPage();
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // Wait for job cards to load
      await page.waitForSelector('.job-search-card', { timeout: 5000 }).catch(() => {
        console.log('Timeout waiting for LinkedIn job cards');
      });
      
      // Extract job data
      const jobsData = await page.evaluate(() => {
        const jobs = [];
        const jobCards = document.querySelectorAll('.job-search-card');
        
        jobCards.forEach((card, index) => {
          try {
            const titleEl = card.querySelector('.base-search-card__title');
            const companyEl = card.querySelector('.base-search-card__subtitle');
            const locationEl = card.querySelector('.job-search-card__location');
            const dateEl = card.querySelector('.job-search-card__listdate');
            const linkEl = card.querySelector('a');
            
            if (titleEl && companyEl) {
              jobs.push({
                id: `linkedin-${index}`,
                title: titleEl.textContent.trim(),
                company: companyEl.textContent.trim(),
                location: locationEl ? locationEl.textContent.trim() : 'Remote',
                postedDate: dateEl ? dateEl.textContent.trim() : '',
                url: linkEl ? linkEl.href : '',
                source: 'LinkedIn'
              });
            }
          } catch (err) {
            console.error('Error parsing LinkedIn job card:', err);
          }
        });
        
        return jobs;
      });
      
      await browser.close();
      console.log(`Found ${jobsData.length} LinkedIn jobs`);
      
      // Process posting dates
      return jobsData.map(job => {
        return {
          ...job,
          postedDays: this.calculatePostedDays(job.postedDate)
        };
      });
    } catch (error) {
      console.error('Error scraping LinkedIn:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Indeed job scraper
   */
  async scrapeIndeedJobs(jobTitle, location) {
    try {
      console.log('Scraping Indeed jobs...');
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(jobTitle)}&l=${encodeURIComponent(location || '')}`;
      
      // Use puppeteer for Indeed to handle dynamic content
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // Wait for job cards to load
      await page.waitForSelector('.job_seen_beacon', { timeout: 5000 }).catch(() => {
        console.log('Timeout waiting for Indeed job cards');
      });
      
      // Extract job data
      const jobsData = await page.evaluate(() => {
        const jobs = [];
        const jobCards = document.querySelectorAll('.job_seen_beacon');
        
        jobCards.forEach((card, index) => {
          try {
            const titleEl = card.querySelector('.jcs-JobTitle');
            const companyEl = card.querySelector('.companyName');
            const locationEl = card.querySelector('.companyLocation');
            const dateEl = card.querySelector('.date');
            const linkEl = card.querySelector('a.jcs-JobTitle');
            const salaryEl = card.querySelector('.salary-snippet-container');
            
            if (titleEl && companyEl) {
              jobs.push({
                id: `indeed-${index}`,
                title: titleEl.textContent.trim(),
                company: companyEl.textContent.trim(),
                location: locationEl ? locationEl.textContent.trim() : 'Remote',
                postedDate: dateEl ? dateEl.textContent.trim() : '',
                salary: salaryEl ? { text: salaryEl.textContent.trim() } : null,
                url: linkEl ? linkEl.href : '',
                source: 'Indeed'
              });
            }
          } catch (err) {
            console.error('Error parsing Indeed job card:', err);
          }
        });
        
        return jobs;
      });
      
      await browser.close();
      console.log(`Found ${jobsData.length} Indeed jobs`);
      
      // Process posting dates and extract salary ranges
      return jobsData.map(job => {
        // Process salary if available
        let salary = null;
        if (job.salary && job.salary.text) {
          salary = this.extractSalaryRange(job.salary.text);
        }
        
        return {
          ...job,
          salary,
          postedDays: this.calculatePostedDays(job.postedDate)
        };
      });
    } catch (error) {
      console.error('Error scraping Indeed:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Glassdoor job scraper
   */
  async scrapeGlassdoorJobs(jobTitle, location) {
    try {
      console.log('Scraping Glassdoor jobs...');
      const searchUrl = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(jobTitle)}&locT=&locId=&jobType=`;
      
      // Use puppeteer for Glassdoor to handle dynamic content
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await page.goto(searchUrl, { waitUntil: 'networkidle2' });
      
      // Glassdoor often has a pop-up to sign in - we need to close it if it appears
      await page.waitForSelector('div[data-test="job-list"], div[data-test="modal-close-btn"]', { timeout: 10000 })
        .then(async () => {
          const closeButton = await page.$('div[data-test="modal-close-btn"]');
          if (closeButton) {
            await closeButton.click();
            await page.waitForSelector('div[data-test="job-list"]', { timeout: 5000 });
          }
        })
        .catch(() => {
          console.log('Timeout waiting for Glassdoor job list or modal');
        });
      
      // Extract job data
      const jobsData = await page.evaluate(() => {
        const jobs = [];
        const jobCards = document.querySelectorAll('li.react-job-listing');
        
        jobCards.forEach((card, index) => {
          try {
            const titleEl = card.querySelector('a.jobLink');
            const companyEl = card.querySelector('div.emp-heading');
            const locationEl = card.querySelector('span.loc');
            const salaryEl = card.querySelector('span.salary-estimate');
            
            if (titleEl && companyEl) {
              jobs.push({
                id: `glassdoor-${index}`,
                title: titleEl.textContent.trim(),
                company: companyEl.textContent.trim(),
                location: locationEl ? locationEl.textContent.trim() : 'Remote',
                salary: salaryEl ? { text: salaryEl.textContent.trim() } : null,
                url: titleEl.href,
                source: 'Glassdoor',
                postedDate: '' // Glassdoor doesn't always show posting dates directly
              });
            }
          } catch (err) {
            console.error('Error parsing Glassdoor job card:', err);
          }
        });
        
        return jobs;
      });
      
      await browser.close();
      console.log(`Found ${jobsData.length} Glassdoor jobs`);
      
      // Process salary ranges and assign random recent posting dates
      return jobsData.map(job => {
        // Process salary if available
        let salary = null;
        if (job.salary && job.salary.text) {
          salary = this.extractSalaryRange(job.salary.text);
        }
        
        // Assign random recent posting date (since Glassdoor doesn't always show it)
        const postedDays = Math.floor(Math.random() * 14) + 1;
        
        return {
          ...job,
          salary,
          postedDays
        };
      });
    } catch (error) {
      console.error('Error scraping Glassdoor:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Extract a standardized salary range from text
   * @param {string} salaryText - The salary text from the job posting 
   * @returns {Object|null} - Standardized min/max salary
   */
  extractSalaryRange(salaryText) {
    try {
      if (!salaryText) return null;
      
      const text = salaryText.toLowerCase();
      
      // Extract numeric values
      const numbers = text.match(/\d+([,\.]\d+)?/g);
      if (!numbers || numbers.length === 0) return null;
      
      // If there's just one number, create a range around it
      if (numbers.length === 1) {
        const base = parseFloat(numbers[0].replace(/,/g, ''));
        
        // Check if it's hourly, daily, or annual
        if (text.includes('hour') || text.includes('/hr') || text.includes('$ hr')) {
          // Convert hourly to annual (40hrs * 52 weeks)
          const annual = Math.round(base * 40 * 52);
          return {
            min: Math.round(annual * 0.9),
            max: Math.round(annual * 1.1)
          };
        } else if (text.includes('day')) {
          // Convert daily to annual (5 days * 50 weeks)
          const annual = Math.round(base * 5 * 50);
          return {
            min: Math.round(annual * 0.9),
            max: Math.round(annual * 1.1)
          };
        } else {
          // Assume it's annual or a K representation
          const multiplier = text.includes('k') ? 1000 : 1;
          const annual = base * multiplier;
          return {
            min: Math.round(annual * 0.9),
            max: Math.round(annual * 1.1)
          };
        }
      } 
      
      // If there are two numbers, assume it's a range
      if (numbers.length >= 2) {
        let min = parseFloat(numbers[0].replace(/,/g, ''));
        let max = parseFloat(numbers[1].replace(/,/g, ''));
        
        // Swap if min is greater than max
        if (min > max) [min, max] = [max, min];
        
        // Check if the values are in thousands
        const multiplier = text.includes('k') ? 1000 : 1;
        
        // Check if it's hourly, daily, or annual
        if (text.includes('hour') || text.includes('/hr') || text.includes('$ hr')) {
          // Convert hourly to annual (40hrs * 52 weeks)
          return {
            min: Math.round(min * 40 * 52 * multiplier),
            max: Math.round(max * 40 * 52 * multiplier)
          };
        } else if (text.includes('day')) {
          // Convert daily to annual (5 days * 50 weeks)
          return {
            min: Math.round(min * 5 * 50 * multiplier),
            max: Math.round(max * 5 * 50 * multiplier)
          };
        } else {
          // Assume it's annual
          return {
            min: Math.round(min * multiplier),
            max: Math.round(max * multiplier)
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting salary range:', error);
      return null;
    }
  }

  /**
   * Calculate days since posting from various date formats
   * @param {string} dateText - The date text from the job posting
   * @returns {number} - Number of days since posting
   */
  calculatePostedDays(dateText) {
    if (!dateText) return Math.floor(Math.random() * 7) + 1; // Default random 1-7 days
    
    const text = dateText.toLowerCase().trim();
    
    // Handle "Just posted", "Today", "Just now" etc.
    if (text.includes('just') || text.includes('today') || text.includes('now')) {
      return 0;
    }
    
    // Handle "Yesterday"
    if (text.includes('yesterday')) {
      return 1;
    }
    
    // Handle "X days ago"
    const daysMatch = text.match(/(\d+)\s*days? ago/);
    if (daysMatch && daysMatch[1]) {
      return parseInt(daysMatch[1]);
    }
    
    // Handle "X hours ago"
    const hoursMatch = text.match(/(\d+)\s*hours? ago/);
    if (hoursMatch && hoursMatch[1]) {
      return 0; // Same day
    }
    
    // Handle "X weeks ago"
    const weeksMatch = text.match(/(\d+)\s*weeks? ago/);
    if (weeksMatch && weeksMatch[1]) {
      return parseInt(weeksMatch[1]) * 7;
    }
    
    // Handle "X months ago"
    const monthsMatch = text.match(/(\d+)\s*months? ago/);
    if (monthsMatch && monthsMatch[1]) {
      return parseInt(monthsMatch[1]) * 30;
    }
    
    // Try to parse a date string
    try {
      const date = new Date(text);
      if (!isNaN(date.getTime())) {
        const diffTime = Math.abs(new Date() - date);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    } catch (e) {
      // Ignore parsing errors
    }
    
    // Default: random recent date
    return Math.floor(Math.random() * 14) + 1; // Random 1-14 days
  }

  /**
   * Process job results with match scores and additional data
   * @param {Array} jobs - The scraped job listings
   * @param {Object} profileInfo - User profile extracted from CV
   * @returns {Array} - Processed job listings
   */
  processJobResults(jobs, profileInfo) {
    // Calculate match scores for each job
    const processedJobs = jobs.map(job => {
      const matchScore = this.calculateMatchScore(job, profileInfo);
      
      // Add additional fields needed for display
      return {
        ...job,
        matchScore,
        // Process salary if not already done
        salary: job.salary || this.generateSalaryRange(job.title, profileInfo.experience),
        jobType: job.jobType || this.guessJobType(job.title),
        experience: job.experience || this.guessExperienceLevel(job.title, profileInfo.experience),
        skills: job.skills || this.guessRequiredSkills(job.title, profileInfo.skills)
      };
    });
    
    // Sort by match score (highest first)
    return processedJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      // Take top 15 results
      .slice(0, 15);
  }

  /**
   * Calculate a match score between a job and profile
   * @param {Object} job - The job listing
   * @param {Object} profile - The user's profile
   * @returns {number} - Match percentage (0-100)
   */
  calculateMatchScore(job, profile) {
    let score = 0;
    const maxScore = 100;
    
    // Title match (50% of score)
    if (job.title && profile.jobTitle) {
      const titleWords = profile.jobTitle.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const jobTitleLower = job.title.toLowerCase();
      
      // Count matches in title
      const titleMatches = titleWords.filter(word => 
        jobTitleLower.includes(word)
      ).length;
      
      // Calculate title score
      const titleScore = Math.min(titleMatches / Math.max(titleWords.length, 1), 1) * 50;
      score += titleScore;
    } else {
      // Default title score if we can't compare
      score += 25;
    }
    
    // Location match (20% of score)
    if (job.location && profile.location) {
      const locationWords = profile.location.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const jobLocationLower = job.location.toLowerCase();
      
      // Count location matches
      const locationMatches = locationWords.filter(word => 
        jobLocationLower.includes(word)
      ).length;
      
      // Calculate location score
      const locationScore = Math.min(locationMatches / Math.max(locationWords.length, 1), 1) * 20;
      score += locationScore;
    } else {
      // Default location score
      score += 10;
    }
    
    // Skills match (30% of score)
    if (job.skills && profile.skills && profile.skills.length > 0) {
      const profileSkillsLower = profile.skills.map(s => s.toLowerCase());
      const jobSkillsLower = job.skills.map(s => s.toLowerCase());
      
      // Count skill matches
      const skillMatches = profileSkillsLower.filter(skill => 
        jobSkillsLower.some(jobSkill => jobSkill.includes(skill))
      ).length;
      
      // Calculate skills score
      const skillsScore = Math.min(skillMatches / Math.max(profile.skills.length, 1), 1) * 30;
      score += skillsScore;
    } else {
      // Default skills score
      score += 15;
    }
    
    // Small random factor (±5%) to diversify results
    const randomFactor = (Math.random() * 10 - 5);
    score = Math.max(0, Math.min(maxScore, score + randomFactor));
    
    return Math.round(score);
  }

  /**
   * Generate a reasonable salary range based on job title and experience
   * @param {string} jobTitle - The job title
   * @param {number|string} experience - Years of experience
   * @returns {Object} - Salary range with min and max
   */
  generateSalaryRange(jobTitle, experience) {
    const titleLower = (jobTitle || '').toLowerCase();
    let baseMin = 70000;
    let baseMax = 90000;
    
    // Adjust for job level
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('architect')) {
      baseMin = 110000;
      baseMax = 150000;
    } else if (titleLower.includes('mid') || titleLower.includes('intermediate')) {
      baseMin = 85000;
      baseMax = 120000;
    } else if (titleLower.includes('junior') || titleLower.includes('entry')) {
      baseMin = 60000;
      baseMax = 85000;
    }
    
    // Adjust for experience
    const expYears = parseInt(experience) || 3;
    const expMultiplier = Math.min(Math.max(expYears, 1) / 3, 2);
    
    const min = Math.round(baseMin * expMultiplier / 5000) * 5000;
    const max = Math.round(baseMax * expMultiplier / 5000) * 5000;
    
    return { min, max };
  }

  /**
   * Guess the job type based on job title
   * @param {string} jobTitle - The job title
   * @returns {string} - The guessed job type
   */
  guessJobType(jobTitle) {
    const titleLower = (jobTitle || '').toLowerCase();
    
    if (titleLower.includes('contract') || titleLower.includes('freelance')) {
      return 'Contract';
    } else if (titleLower.includes('part-time') || titleLower.includes('part time')) {
      return 'Part-time';
    } else if (titleLower.includes('intern') || titleLower.includes('internship')) {
      return 'Internship';
    } else if (titleLower.includes('remote')) {
      return 'Remote';
    } else {
      return 'Full-time';
    }
  }

  /**
   * Guess the experience level required based on job title
   * @param {string} jobTitle - The job title
   * @param {number|string} experience - User's years of experience
   * @returns {string} - The guessed experience level
   */
  guessExperienceLevel(jobTitle, experience) {
    const titleLower = (jobTitle || '').toLowerCase();
    
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('architect')) {
      return 'Senior';
    } else if (titleLower.includes('mid') || titleLower.includes('intermediate')) {
      return 'Mid-level';
    } else if (titleLower.includes('junior') || titleLower.includes('entry')) {
      return 'Entry-level';
    } else if (titleLower.includes('executive') || titleLower.includes('director') || titleLower.includes('head of')) {
      return 'Executive';
    } else {
      // Determine based on user's experience
      const expYears = parseInt(experience) || 3;
      if (expYears >= 8) {
        return 'Senior';
      } else if (expYears >= 3) {
        return 'Mid-level';
      } else {
        return 'Entry-level';
      }
    }
  }

  /**
   * Guess required skills based on job title and user skills
   * @param {string} jobTitle - The job title
   * @param {Array} userSkills - User's skills
   * @returns {Array} - Guessed required skills
   */
  guessRequiredSkills(jobTitle, userSkills = []) {
    const titleLower = (jobTitle || '').toLowerCase();
    const commonSkills = [];
    
    // Add skills based on job title keywords
    if (titleLower.includes('react') || titleLower.includes('frontend') || titleLower.includes('front-end')) {
      commonSkills.push('React', 'JavaScript', 'HTML', 'CSS');
    }
    
    if (titleLower.includes('angular')) {
      commonSkills.push('Angular', 'TypeScript', 'RxJS');
    }
    
    if (titleLower.includes('vue')) {
      commonSkills.push('Vue.js', 'JavaScript', 'Vuex');
    }
    
    if (titleLower.includes('node') || titleLower.includes('backend') || titleLower.includes('back-end')) {
      commonSkills.push('Node.js', 'Express', 'API Design');
    }
    
    if (titleLower.includes('full stack') || titleLower.includes('fullstack')) {
      commonSkills.push('JavaScript', 'HTML', 'CSS', 'Node.js', 'Database Design');
    }
    
    if (titleLower.includes('python')) {
      commonSkills.push('Python', 'Django', 'Flask');
    }
    
    if (titleLower.includes('java')) {
      commonSkills.push('Java', 'Spring', 'Hibernate');
    }
    
    if (titleLower.includes('data')) {
      commonSkills.push('SQL', 'Data Analysis', 'Database Design');
    }
    
    if (titleLower.includes('devops') || titleLower.includes('cloud')) {
      commonSkills.push('AWS', 'Docker', 'CI/CD', 'Kubernetes');
    }
    
    // Include some of the user's skills
    if (userSkills && userSkills.length > 0) {
      // Randomly select 3-5 skills from user's skills that aren't already in commonSkills
      const uniqueUserSkills = userSkills.filter(skill => 
        !commonSkills.some(common => common.toLowerCase() === skill.toLowerCase())
      );
      
      const numSkillsToAdd = Math.min(uniqueUserSkills.length, Math.floor(Math.random() * 3) + 3);
      
      // Shuffle the array for random selection
      const shuffled = [...uniqueUserSkills];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      for (let i = 0; i < numSkillsToAdd && i < shuffled.length; i++) {
        commonSkills.push(shuffled[i]);
      }
    }
    
    // If we still don't have enough skills, add some generic ones
    if (commonSkills.length < 3) {
      const genericSkills = ['Problem Solving', 'Communication', 'Git', 'Agile', 'Teamwork'];
      const numToAdd = 3 - commonSkills.length;
      
      for (let i = 0; i < numToAdd && i < genericSkills.length; i++) {
        commonSkills.push(genericSkills[i]);
      }
    }
    
    // Deduplicate and return
    return Array.from(new Set(commonSkills));
  }

  /**
   * Map years of experience to job experience level
   * @param {number} years - Years of experience
   * @returns {string} - Experience level
   */
  mapExperienceLevel(years) {
    const expYears = parseInt(years, 10);
    
    if (isNaN(expYears)) return null;
    
    if (expYears < 2) return 'Entry-level';
    if (expYears < 5) return 'Mid-level';
    if (expYears < 10) return 'Senior';
    return 'Executive';
  }

  /**
   * Calculate days ago from date
   * @param {Date} date - The date
   * @returns {number} - Days ago
   */
  calculateDaysAgo(date) {
    const postedDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - postedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Generate mock jobs for demonstration purposes
   * @param {Object} profileInfo - Profile information
   * @returns {Array} - Mock jobs
   */
  generateMockJobs(profileInfo) {
    const { jobTitle, skills = [], location, industry } = profileInfo;
    
    // Skip if no job title provided
    if (!jobTitle) return [];
    
    // Generate between 5-15 mock jobs
    const count = Math.floor(Math.random() * 10) + 5;
    const mockJobs = [];
    
    // Job types
    const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];
    
    // Experience levels
    const expLevels = ['Entry-level', 'Mid-level', 'Senior', 'Executive'];
    
    // Companies
    const companies = [
      'Acme Corporation', 'Globex', 'Initech', 'Massive Dynamic',
      'Stark Industries', 'Wayne Enterprises', 'Cyberdyne Systems',
      'Oscorp', 'Umbrella Corporation', 'Soylent Corp', 'TechCorp',
      'InnovateTech', 'BigDataCo', 'SmartSolutions', 'NextGen Systems'
    ];
    
    // Sources
    const sources = ['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'Monster'];
    
    // Locations - use the provided location if available, otherwise generate random ones
    const locations = location ? 
      [location, `Remote - ${location}`, `Hybrid - ${location}`] : 
      ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Seattle, WA', 
       'Boston, MA', 'Chicago, IL', 'Remote', 'Hybrid - Multiple Locations'];
    
    // Salary ranges based on experience
    const salaryRanges = {
      'Entry-level': { min: 50000, max: 80000 },
      'Mid-level': { min: 80000, max: 120000 },
      'Senior': { min: 120000, max: 180000 },
      'Executive': { min: 150000, max: 250000 }
    };
    
    // Related skills for the specified job title
    let relatedSkills = [...skills];
    
    // Add more skills based on job title if needed
    if (jobTitle.toLowerCase().includes('developer') || jobTitle.toLowerCase().includes('engineer')) {
      relatedSkills = [...relatedSkills, 'JavaScript', 'React', 'Node.js', 'Python', 'Git', 'API Development'];
    } else if (jobTitle.toLowerCase().includes('designer')) {
      relatedSkills = [...relatedSkills, 'UI/UX', 'Figma', 'Adobe XD', 'Sketch', 'Prototyping'];
    } else if (jobTitle.toLowerCase().includes('manager')) {
      relatedSkills = [...relatedSkills, 'Leadership', 'Project Management', 'Agile', 'Scrum', 'Stakeholder Management'];
    } else if (jobTitle.toLowerCase().includes('data')) {
      relatedSkills = [...relatedSkills, 'SQL', 'Python', 'Data Analysis', 'Tableau', 'Machine Learning'];
    }
    
    // Make the skills unique
    relatedSkills = [...new Set(relatedSkills)];
    
    // Generate jobs
    for (let i = 0; i < count; i++) {
      // Determine job details
      const company = companies[Math.floor(Math.random() * companies.length)];
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const expLevel = expLevels[Math.floor(Math.random() * expLevels.length)];
      const postedDays = Math.floor(Math.random() * 14);
      const source = sources[Math.floor(Math.random() * sources.length)];
      const mockLocation = locations[Math.floor(Math.random() * locations.length)];
      
      // Determine salary range based on experience level
      const salaryRange = salaryRanges[expLevel];
      const minSalary = salaryRange.min + Math.floor(Math.random() * 10000);
      const maxSalary = salaryRange.max - Math.floor(Math.random() * 10000);
      
      // Generate random job title variations
      let mockTitle = jobTitle;
      
      // Sometimes add a prefix or suffix to the title
      if (Math.random() > 0.7) {
        const prefixes = ['Senior ', 'Lead ', 'Principal ', 'Junior ', 'Staff '];
        mockTitle = prefixes[Math.floor(Math.random() * prefixes.length)] + mockTitle;
      }
      
      if (Math.random() > 0.8) {
        const suffixes = [' Specialist', ' Consultant', ' (Remote)', ' - Contract', ' - Temp'];
        mockTitle += suffixes[Math.floor(Math.random() * suffixes.length)];
      }
      
      // Select a random subset of skills
      const skillCount = Math.floor(Math.random() * Math.min(5, relatedSkills.length)) + 3;
      const shuffledSkills = [...relatedSkills].sort(() => 0.5 - Math.random());
      const jobSkills = shuffledSkills.slice(0, skillCount);
      
      // Create the mock job
      mockJobs.push({
        id: `mock-${i}-${Date.now()}`,
        title: mockTitle,
        company: company,
        location: mockLocation,
        description: `We are seeking a talented ${mockTitle} to join our team at ${company}...`,
        jobType: jobType,
        experience: expLevel,
        skills: jobSkills,
        salary: {
          min: minSalary,
          max: maxSalary,
          currency: 'USD'
        },
        url: `https://example.com/jobs/${i}`,
        source: source,
        postedDays: postedDays,
        isInternal: false
      });
    }
    
    return mockJobs;
  }
}

module.exports = new JobScraperService();